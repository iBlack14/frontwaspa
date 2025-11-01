export default async function handler(req, res) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const baseDomain = process.env.EASYPANEL_BASE_DOMAIN;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    configuration: {
      backend_url: backendUrl || '❌ NOT_SET',
      base_domain: baseDomain || '❌ NOT_SET',
      supabase_url: supabaseUrl ? '✅ SET' : '❌ NOT_SET',
      nextauth_url: process.env.NEXTAUTH_URL || '❌ NOT_SET',
    },
    backend_health: {
      reachable: false,
      status: null,
      error: null,
      response_time: null
    }
  };

  // Verificar conectividad con el backend
  if (backendUrl) {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${backendUrl}/health`, { 
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      diagnostics.backend_health.reachable = response.ok;
      diagnostics.backend_health.status = response.status;
      diagnostics.backend_health.response_time = `${Date.now() - startTime}ms`;
      
      if (response.ok) {
        const data = await response.json();
        diagnostics.backend_health.data = data;
      }
    } catch (error) {
      diagnostics.backend_health.error = error.message;
      diagnostics.backend_health.error_type = error.name;
      diagnostics.backend_health.response_time = `${Date.now() - startTime}ms`;
    }
  } else {
    diagnostics.backend_health.error = 'NEXT_PUBLIC_BACKEND_URL no está configurado';
  }

  // Verificar Supabase
  if (supabaseUrl) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        }
      });
      diagnostics.supabase_health = {
        reachable: response.ok,
        status: response.status
      };
    } catch (error) {
      diagnostics.supabase_health = {
        reachable: false,
        error: error.message
      };
    }
  }

  return res.status(200).json(diagnostics);
}
