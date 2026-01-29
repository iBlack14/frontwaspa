/**
 * API ENDPOINT: Enviar Imagen de WhatsApp
 * ====================================
 * Endpoint para recibir imágenes pegadas desde el clipboard
 * y enviarlas a través de WhatsApp.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import formidable, { Fields, Files } from 'formidable';
import fs from 'fs';
import path from 'path';

// Deshabilitar el parser de body por defecto de Next.js
export const config = {
    api: {
        bodyParser: false,
    },
};

/**
 * Handler principal del endpoint
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // Solo permitir POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // ────────────────────────────────────────────────────────
        // 📋 PASO 1: Parsear el FormData
        // ────────────────────────────────────────────────────────
        const form = formidable({
            uploadDir: path.join(process.cwd(), 'public', 'temp'),
            keepExtensions: true,
            maxFileSize: 10 * 1024 * 1024, // 10MB max
        });

        // Crear directorio temporal si no existe
        const tempDir = path.join(process.cwd(), 'public', 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const [fields, files] = await new Promise<[Fields, Files]>(
            (resolve, reject) => {
                form.parse(req, (err, fields, files) => {
                    if (err) reject(err);
                    else resolve([fields, files]);
                });
            }
        );

        // ────────────────────────────────────────────────────────
        // ✅ PASO 2: Validar que hay una imagen
        // ────────────────────────────────────────────────────────
        const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;

        if (!imageFile) {
            return res.status(400).json({ error: 'No se envió ninguna imagen' });
        }

        // Extraer caption si existe
        const caption = Array.isArray(fields.caption)
            ? fields.caption[0]
            : fields.caption;

        // ────────────────────────────────────────────────────────
        // 📤 PASO 3: Enviar al backend de WhatsApp
        // ────────────────────────────────────────────────────────
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';

        // Leer el archivo
        const fileBuffer = fs.readFileSync(imageFile.filepath);
        const fileName = imageFile.originalFilename || `pasted-image-${Date.now()}.png`;

        // Crear FormData para el backend
        const formData = new FormData();
        const blob = new Blob([fileBuffer], { type: imageFile.mimetype || 'image/png' });
        formData.append('file', blob, fileName);

        if (caption) {
            formData.append('caption', caption);
        }

        // Enviar al backend de WhatsApp
        const response = await fetch(`${backendUrl}/api/send-media`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Error al enviar imagen al backend de WhatsApp');
        }

        const result = await response.json();

        // ────────────────────────────────────────────────────────
        // 🧹 PASO 4: Limpiar archivo temporal
        // ────────────────────────────────────────────────────────
        fs.unlinkSync(imageFile.filepath);

        // ────────────────────────────────────────────────────────
        // ✅ PASO 5: Retornar respuesta exitosa
        // ────────────────────────────────────────────────────────
        return res.status(200).json({
            success: true,
            messageId: result.messageId,
            mediaUrl: result.mediaUrl,
            caption: caption,
            timestamp: new Date().toISOString(),
        });

    } catch (error: any) {
        console.error('❌ Error in send-image endpoint:', error);
        return res.status(500).json({
            error: 'Error al procesar la imagen',
            details: error.message,
        });
    }
}
