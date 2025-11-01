export default async function handler(req, res) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    
    if (!backendUrl) {
      return res.status(500).json({ 
        success: false,
        error: 'NEXT_PUBLIC_BACKEND_URL no está configurado',
        help: 'Configura esta variable en Easypanel: Settings → Environment Variables'
      });
    }

    console.log(`Testing backend connection to: ${backendUrl}`);

    // Intentar conectar al backend
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

    const startTime = Date.now();
    const response = await fetch(`${backendUrl}/health`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `Backend respondió con status ${response.status}`,
        backend_url: backendUrl,
        response_time: `${responseTime}ms`,
        status: response.status
      });
    }

    const data = await response.json();
    
    return res.status(200).json({ 
      success: true, 
      message: '✅ Backend está accesible',
      backend_url: backendUrl,
      backend_response: data,
      response_time: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Backend connection error:', error);
    
    let errorMessage = error.message;
    let errorType = error.name;
    
    if (error.name === 'AbortError') {
      errorMessage = 'Timeout: El backend no respondió en 10 segundos';
      errorType = 'TIMEOUT';
    } else if (error.message.includes('ECONNREFUSED')) {
      errorMessage = 'Conexión rechazada: El backend no está corriendo o no es accesible';
      errorType = 'CONNECTION_REFUSED';
    } else if (error.message.includes('ENOTFOUND')) {
      errorMessage = 'Dominio no encontrado: Verifica la URL del backend';
      errorType = 'DNS_ERROR';
    }
    
    return res.status(500).json({ 
      success: false,
      error: errorMessage,
      error_type: errorType,
      backend_url: process.env.NEXT_PUBLIC_BACKEND_URL,
      help: 'Verifica que el backend esté corriendo y que NEXT_PUBLIC_BACKEND_URL sea correcto'
    });
  }
}
