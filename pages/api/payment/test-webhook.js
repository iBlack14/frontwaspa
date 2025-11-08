/**
 * Endpoint de prueba para verificar que el webhook está accesible
 * GET /api/payment/test-webhook
 */
export default async function handler(req, res) {
  console.log('[Test Webhook] Called with method:', req.method);
  
  return res.status(200).json({ 
    success: true,
    message: 'Webhook endpoint is accessible',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
}
