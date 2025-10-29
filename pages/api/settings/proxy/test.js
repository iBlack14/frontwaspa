import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Verificar sesión
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.id) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const {
      proxy_type,
      proxy_host,
      proxy_port,
      proxy_username,
      proxy_password,
    } = req.body;

    // Validaciones
    if (!proxy_host || !proxy_port) {
      return res.status(400).json({ error: 'Host y puerto son requeridos' });
    }

    // Construir URL del proxy
    let proxyUrl;
    if (proxy_username && proxy_password) {
      proxyUrl = `${proxy_type}://${proxy_username}:${proxy_password}@${proxy_host}:${proxy_port}`;
    } else {
      proxyUrl = `${proxy_type}://${proxy_host}:${proxy_port}`;
    }

    // Crear agente según el tipo de proxy
    let agent;
    if (proxy_type === 'socks4' || proxy_type === 'socks5') {
      agent = new SocksProxyAgent(proxyUrl);
    } else {
      agent = new HttpsProxyAgent(proxyUrl);
    }

    console.log('[PROXY-TEST] Probando conexión a:', proxy_host);

    // Probar conexión haciendo request a un servicio que devuelve la IP
    const testResponse = await axios.get('https://api.ipify.org?format=json', {
      httpAgent: agent,
      httpsAgent: agent,
      timeout: 15000, // 15 segundos timeout
    });

    const ip = testResponse.data.ip;
    console.log('[PROXY-TEST] ✅ Conexión exitosa. IP:', ip);

    // Opcional: Obtener ubicación de la IP
    let location = 'Desconocida';
    try {
      const geoResponse = await axios.get(`https://ipapi.co/${ip}/json/`, {
        timeout: 5000,
      });
      location = `${geoResponse.data.city}, ${geoResponse.data.country_name}`;
    } catch (geoError) {
      console.log('[PROXY-TEST] No se pudo obtener geolocalización');
    }

    return res.json({
      success: true,
      ip,
      location,
      message: 'Proxy funciona correctamente',
    });
  } catch (error) {
    console.error('[PROXY-TEST] ❌ Error:', error.message);
    
    let errorMessage = 'No se pudo conectar al proxy';
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Conexión rechazada. Verifica host y puerto';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Tiempo de espera agotado. El proxy no responde';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Host no encontrado. Verifica la dirección';
    } else if (error.response?.status === 407) {
      errorMessage = 'Error de autenticación. Verifica usuario/contraseña';
    }

    return res.status(400).json({
      success: false,
      error: errorMessage,
      details: error.message,
    });
  }
}
