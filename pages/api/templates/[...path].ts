import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { path } = req.query;
    const pathStr = Array.isArray(path) ? path.join('/') : path;

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;
    
    if (!backendUrl) {
      console.error('[API/templates] Backend URL no configurada');
      return res.status(500).json({ error: 'Backend no configurado' });
    }

    const fullUrl = `${backendUrl}/api/templates/${pathStr}${req.url?.includes('?') ? '?' + req.url.split('?')[1] : ''}`;
    
    console.log('[API/templates] ' + req.method, fullUrl);

    const response = await axios({
      method: req.method,
      url: fullUrl,
      data: req.body,
      params: req.query,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { Authorization: req.headers.authorization }),
      },
      timeout: 10000,
    });

    return res.status(response.status).json(response.data);

  } catch (error: any) {
    console.error('[API/templates] Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.error || error.message || 'Error en operación de templates';

    return res.status(statusCode).json({ error: errorMessage });
  }
}
