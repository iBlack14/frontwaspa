// Script de diagnóstico para Supabase WebSocket
// Ejecutar en la consola del navegador: import('./supabase-test.js')

console.log('🔍 Iniciando diagnóstico de Supabase...');

const SUPABASE_URL = window.location.origin.includes('localhost')
  ? 'http://localhost:3000'
  : window.location.origin;

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

async function testSupabaseConnectivity() {
  console.log('📡 Probando conectividad REST API...');

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    console.log(`✅ REST API: ${response.status} ${response.statusText}`);
  } catch (error) {
    console.error('❌ REST API Error:', error.message);
  }
}

function testWebSocketConnectivity() {
  console.log('🔌 Probando conectividad WebSocket...');

  const wsUrl = `wss://wasapi-supabase.ld4pxg.easypanel.host/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&eventsPerSecond=2&vsn=1.0.0`;

  console.log('WebSocket URL:', wsUrl);

  try {
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ WebSocket conectado exitosamente');
      ws.send(JSON.stringify({
        topic: 'realtime:test',
        event: 'phx_join',
        payload: {},
        ref: '1'
      }));
    };

    ws.onmessage = (event) => {
      console.log('📨 WebSocket mensaje recibido:', event.data);
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    ws.onclose = (event) => {
      console.log(`🔌 WebSocket cerrado: ${event.code} ${event.reason}`);
    };

    // Timeout después de 10 segundos
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        console.log('⏰ Cerrando WebSocket de prueba...');
        ws.close();
      }
    }, 10000);

  } catch (error) {
    console.error('❌ Error creando WebSocket:', error);
  }
}

async function runDiagnostics() {
  console.log('🚀 Ejecutando diagnóstico completo de Supabase...\n');

  await testSupabaseConnectivity();
  console.log('');
  testWebSocketConnectivity();

  console.log('\n📋 Diagnóstico completado. Revisa los mensajes arriba.');
}

// Ejecutar automáticamente
runDiagnostics();

// Exportar funciones para uso manual
window.testSupabaseConnectivity = testSupabaseConnectivity;
window.testWebSocketConnectivity = testWebSocketConnectivity;
window.runSupabaseDiagnostics = runDiagnostics;

console.log('💡 Funciones disponibles:');
console.log('- testSupabaseConnectivity()');
console.log('- testWebSocketConnectivity()');
console.log('- runSupabaseDiagnostics()');