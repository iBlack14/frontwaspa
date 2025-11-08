import axios from 'axios';

/**
 * Endpoint para crear un token de pago con Izipay
 * POST /api/payment/create-token
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency = 'PEN', orderId, customerEmail } = req.body;

    console.log('[Izipay API] Request received:', { amount, currency, orderId, customerEmail });

    // Validaciones
    if (!amount || !orderId || !customerEmail) {
      console.error('[Izipay API] Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields: amount, orderId, customerEmail' 
      });
    }

    // Credenciales de Izipay
    const username = process.env.IZIPAY_USERNAME || '47575197';
    const password = process.env.IZIPAY_PASSWORD || 'testpassword_aUfHU1fnUEv66whwWsBctdGPoRzYRnpgYjVv0Wx6vobGR';
    const endpoint = process.env.NEXT_PUBLIC_IZIPAY_ENDPOINT || 'https://api.micuentaweb.pe';

    console.log('[Izipay API] Using credentials:', { 
      username, 
      endpoint,
      passwordLength: password.length 
    });

    // Crear el token de pago
    const response = await axios.post(
      `${endpoint}/api-payment/V4/Charge/CreatePayment`,
      {
        amount: Math.round(amount * 100), // Convertir a centavos
        currency: currency,
        orderId: orderId,
        customer: {
          email: customerEmail
        }
      },
      {
        auth: {
          username: username,
          password: password
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('[Izipay] Token created successfully:', response.data);

    return res.status(200).json({
      success: true,
      formToken: response.data.answer.formToken,
      orderId: orderId
    });

  } catch (error) {
    console.error('[Izipay] Error creating token:', error.response?.data || error.message);
    return res.status(500).json({ 
      error: 'Failed to create payment token',
      details: error.response?.data || error.message
    });
  }
}
