import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { jwt } = req.body;

    if (!jwt) {
      return res.status(400).json({ error: 'JWT no proporcionado' });
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;
    if (!backendUrl) {
      console.error('[API] Backend URL no configurada');
      return res.status(500).json({ error: 'Backend no configurado' });
    }

    console.log('[API/user/get] Obteniendo datos del usuario desde:', backendUrl);

    // Hacer petición al backend externo
    const response = await axios.post(
      `${backendUrl}/api/user/get`,
      { jwt },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        timeout: 10000,
      }
    );

    console.log('[API/user/get] Respuesta exitosa del backend');
    return res.status(200).json(response.data);

  } catch (error: any) {
    console.error('[API/user/get] Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL,
    });

    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.error || error.message || 'Error al obtener datos del usuario';

    return res.status(statusCode).json({ error: errorMessage });
  }
}
