import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Inicializar cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Usar service role key para bypass RLS
);

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

    if (orderStatus === 'PAID') {
      console.log('[Izipay Webhook] Payment successful, processing...');
      
      const transaction = transactions[0];
      const amount = transaction.amount / 100; // Convertir de centavos a soles
      
      // 1. Buscar o crear usuario
      const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
      let user = authUser?.users?.find(u => u.email === customer.email);
      
      // Si el usuario no existe, crearlo con contraseña temporal
      if (!user) {
        console.log('[Izipay Webhook] User not found, creating new user:', customer.email);
        
        // Generar contraseña temporal
        const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!${Date.now().toString(36)}`;
        
        // Crear usuario en Supabase Auth
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: customer.email,
          password: tempPassword,
          email_confirm: true, // Confirmar email automáticamente
          user_metadata: {
            created_from_payment: true,
            order_id: orderDetails.orderId
          }
        });
        
        if (createError) {
          console.error('[Izipay Webhook] Error creating user:', createError);
          return res.status(500).json({ success: false, error: 'Failed to create user' });
        }
        
        user = newUser.user;
        
        // Actualizar perfil con contraseña temporal
        await supabase
          .from('profiles')
          .update({
            must_change_password: true,
            temp_password: tempPassword
          })
          .eq('id', user.id);
        
        console.log('[Izipay Webhook] User created with temp password');
        
        // TODO: Enviar email con credenciales
        console.log('[Izipay Webhook] Credentials:', {
          email: customer.email,
          password: tempPassword
        });
      }
      
      // 2. Guardar el pago en la base de datos
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          order_id: orderDetails.orderId,
          transaction_id: transaction.uuid,
          amount: amount,
          currency: transaction.currency,
          status: 'paid',
          payment_method: transaction.paymentMethodType,
          customer_email: customer.email,
          izipay_response: answer
        })
        .select()
        .single();
      
      if (paymentError) {
        console.error('[Izipay Webhook] Error saving payment:', paymentError);
      } else {
        console.log('[Izipay Webhook] Payment saved:', payment.id);
      }
      
      // 3. Determinar el plan según el monto
      let planType = 'basic';
      let planExpiresAt = new Date();
      
      if (amount >= 99) {
        planType = 'premium';
        planExpiresAt.setMonth(planExpiresAt.getMonth() + 1); // 1 mes
      } else if (amount >= 49) {
        planType = 'basic';
        planExpiresAt.setMonth(planExpiresAt.getMonth() + 1); // 1 mes
      }
      
      // 4. Actualizar el perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .update({
          plan_type: planType,
          status_plan: true,
          plan_expires_at: planExpiresAt.toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();
      
      if (profileError) {
        console.error('[Izipay Webhook] Error updating profile:', profileError);
      } else {
        console.log('[Izipay Webhook] Profile updated:', profile.username, 'Plan:', planType);
      }
      
      // 5. TODO: Enviar email de confirmación
      console.log('[Izipay Webhook] Payment processed successfully');
    } else {
      console.log('[Izipay Webhook] Payment not completed:', orderStatus);
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('[Izipay Webhook] Error processing webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
