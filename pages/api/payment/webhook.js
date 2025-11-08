import crypto from 'crypto';

/**
 * Webhook de Izipay para recibir notificaciones de pago
 * POST /api/payment/webhook
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 'kr-answer': krAnswer, 'kr-hash': krHash } = req.body;

    // Verificar la firma HMAC
    const hmacKey = process.env.IZIPAY_HMAC_KEY || 'ypEXi0Ia8SIpqW4SDQsqDvslpNuBB9M0EEg0h2OYcnUHH';
    const calculatedHash = crypto
      .createHmac('sha256', hmacKey)
      .update(krAnswer)
      .digest('hex');

    if (calculatedHash !== krHash) {
      console.error('[Izipay Webhook] Invalid signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Parsear la respuesta
    const answer = JSON.parse(krAnswer);
    const { orderStatus, orderDetails, customer, transactions } = answer;

    console.log('[Izipay Webhook] Payment received:', {
      orderId: orderDetails.orderId,
      status: orderStatus,
      amount: transactions[0].amount,
      currency: transactions[0].currency,
      customerEmail: customer.email
    });

    // Aquí deberías:
    // 1. Verificar el estado del pago (orderStatus === 'PAID')
    // 2. Actualizar la base de datos del usuario
    // 3. Activar la suscripción
    // 4. Enviar email de confirmación

    if (orderStatus === 'PAID') {
      // TODO: Actualizar base de datos
      console.log('[Izipay Webhook] Payment successful, activating subscription...');
      
      // Ejemplo: Actualizar Supabase
      // const { data, error } = await supabase
      //   .from('profiles')
      //   .update({ 
      //     plan_type: 'pro',
      //     status_plan: true,
      //     subscription_date: new Date().toISOString()
      //   })
      //   .eq('email', customer.email);
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('[Izipay Webhook] Error processing webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
