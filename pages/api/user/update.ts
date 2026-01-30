import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { jwt, username, key, openai_api_key, gemini_api_key } = req.body;

    if (!jwt) {
      return res.status(400).json({ error: 'JWT no proporcionado' });
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;
    if (!backendUrl) {
      console.error('[API] Backend URL no configurada');
      return res.status(500).json({ error: 'Backend no configurado' });
    }

    console.log('[API/user/update] Actualizando datos del usuario en:', backendUrl);

    // Hacer petición al backend externo
    const response = await axios.post(
      `${backendUrl}/api/user/update`,
      {
        jwt,
        username,
        key,
        openai_api_key,
        gemini_api_key,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        timeout: 10000,
      }
    );

    console.log('[API/user/update] Actualización exitosa en el backend');
    return res.status(200).json(response.data);

  } catch (error: any) {
    console.error('[API/user/update] Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL,
    });

    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.error || error.message || 'Error al actualizar datos del usuario';

    return res.status(statusCode).json({ error: errorMessage });
  }
}
