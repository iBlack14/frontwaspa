import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;
    
    if (!backendUrl) {
      console.error('[API/instances] Backend URL no configurada');
      return res.status(500).json({ error: 'Backend no configurado' });
    }

    console.log('[API/instances] ' + req.method, backendUrl + '/api/instances');

    // Pasar la petición al backend
    const response = await axios({
      method: req.method,
      url: `${backendUrl}/api/instances`,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { Authorization: req.headers.authorization }),
      },
      timeout: 10000,
    });

    return res.status(response.status).json(response.data);

  } catch (error: any) {
    console.error('[API/instances] Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.error || error.message || 'Error en operación de instancias';

    return res.status(statusCode).json({ error: errorMessage });
  }
}
