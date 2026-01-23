export default async function handler(req, res) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const diagnostics = {
    timestamp: new Date().toISOString(),
    supabase: {
      url: supabaseUrl ? 'SET' : 'NOT_SET',
      anon_key: supabaseAnonKey ? 'SET' : 'NOT_SET',
      realtime_url: supabaseUrl ? `${supabaseUrl.replace('https://', 'wss://')}/realtime/v1/websocket` : null
    },
    connectivity: {
      rest_api: { reachable: false, status: null, error: null },
      realtime_ws: { reachable: false, error: null },
      auth: { working: false, error: null }
    }
  };

  // Verificar conectividad REST API
  if (supabaseUrl && supabaseAnonKey) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      });
      diagnostics.connectivity.rest_api.reachable = response.ok;
      diagnostics.connectivity.rest_api.status = response.status;
    } catch (error) {
      diagnostics.connectivity.rest_api.error = error.message;
    }

    // Verificar autenticación
    try {
      const authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'testpassword'
        })
      });
      // Even if it fails with invalid credentials, if we get a response, auth is working
      diagnostics.connectivity.auth.working = authResponse.status !== 0;
      if (authResponse.status === 400) {
        diagnostics.connectivity.auth.error = 'Auth endpoint responding (expected for test credentials)';
      }
    } catch (error) {
      diagnostics.connectivity.auth.error = error.message;
    }
  }

  // Verificar WebSocket (simulación - no podemos hacer una conexión real desde el servidor)
  diagnostics.connectivity.realtime_ws.note = 'WebSocket connectivity should be tested from browser console';

  return res.status(200).json(diagnostics);
}