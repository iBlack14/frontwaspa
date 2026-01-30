import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { path } = req.query;
    
    // Ignorar rutas que ya tienen handlers específicos
    if (Array.isArray(path) && (path[0] === 'templates')) {
      return res.status(404).json({ error: 'Ruta no encontrada' });
    }

    const pathStr = Array.isArray(path) ? path.join('/') : path;

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;
    
    if (!backendUrl) {
      console.error('[API/catch-all] Backend URL no configurada');
      return res.status(500).json({ error: 'Backend no configurado' });
    }

    // Construir URL completa manteniendo query params
    let fullUrl = `${backendUrl}/api/${pathStr}`;
    const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
    if (queryString && pathStr !== queryString.split('=')[0]) {
      fullUrl += '?' + queryString;
    }
    
    console.log('[API/catch-all] ' + req.method, fullUrl);

    const response = await axios({
      method: req.method,
      url: fullUrl,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { Authorization: req.headers.authorization }),
      },
      timeout: 15000,
      validateStatus: () => true, // No lanzar error en status no 2xx
    });

    return res.status(response.status).json(response.data);

  } catch (error: any) {
    console.error('[API/catch-all] Error crítico:', {
      message: error.message,
      code: error.code,
    });

    return res.status(500).json({ 
      error: 'Error de conexión con el backend',
      details: error.message 
    });
  }
}
