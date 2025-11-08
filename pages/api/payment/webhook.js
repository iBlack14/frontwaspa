import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Configuración de Next.js API
export const config = {
  api: {
    bodyParser: true,
  },
};

// Inicializar cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Usar service role key para bypass RLS
);

// Inicializar Resend
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Webhook de Izipay para recibir notificaciones de pago
 * POST /api/payment/webhook
 */
export default async function handler(req, res) {
  console.log('[Izipay Webhook] Webhook called');
  
  if (req.method !== 'POST') {
    console.log('[Izipay Webhook] Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 'kr-answer': krAnswer, 'kr-hash': krHash } = req.body;
    
    if (!krAnswer || !krHash) {
      console.error('[Izipay Webhook] Missing kr-answer or kr-hash');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verificar la firma HMAC
    // Izipay usa el PASSWORD para firmar
    const hmacKey = process.env.IZIPAY_PASSWORD || 'testpassword_aUfHU1fnUEv66whwWsBctdGPoRzYRnpgYjVv0Wx6vobGR';
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
        
        // Determinar nombre del plan
        let planName = 'Basic';
        if (amount >= 99) {
          planName = 'Premium';
        }
        
        // Enviar email con credenciales usando Resend
        try {
          const { data: emailData, error: emailError } = await resend.emails.send({
            from: 'BLXK Studio <noreply@blxkstudio.com>',
            to: [customer.email],
            subject: '🎉 ¡Bienvenido a BLXK Studio! - Tus credenciales de acceso',
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
                  <tr>
                    <td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        <tr>
                          <td style="background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">¡Bienvenido a BLXK Studio! 🎉</h1>
                            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Tu pago ha sido procesado exitosamente</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 40px 30px;">
                            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hola,</p>
                            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Gracias por tu compra del <strong>Plan ${planName}</strong>. Hemos creado tu cuenta y aquí están tus credenciales de acceso:</p>
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 2px solid #10b981; border-radius: 12px; margin: 30px 0;">
                              <tr>
                                <td style="padding: 30px;">
                                  <p style="color: #6b7280; font-size: 14px; margin: 0 0 5px 0; font-weight: 600;">📧 Correo electrónico:</p>
                                  <p style="color: #111827; font-size: 16px; margin: 0 0 15px 0; font-family: 'Courier New', monospace; background-color: #ffffff; padding: 12px; border-radius: 6px;">${customer.email}</p>
                                  <p style="color: #6b7280; font-size: 14px; margin: 0 0 5px 0; font-weight: 600;">🔑 Contraseña temporal:</p>
                                  <p style="color: #111827; font-size: 16px; margin: 0; font-family: 'Courier New', monospace; background-color: #ffffff; padding: 12px; border-radius: 6px;">${tempPassword}</p>
                                </td>
                              </tr>
                            </table>
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; margin: 20px 0;">
                              <tr>
                                <td style="padding: 20px;">
                                  <p style="color: #92400e; font-size: 14px; margin: 0;"><strong>⚠️ Importante:</strong> Por seguridad, deberás cambiar tu contraseña temporal en el primer inicio de sesión.</p>
                                </td>
                              </tr>
                            </table>
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                              <tr>
                                <td align="center">
                                  <a href="https://connect.blxkstudio.com/login" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">Iniciar sesión ahora</a>
                                </td>
                              </tr>
                            </table>
                            <p style="color: #6b7280; font-size: 14px; margin: 30px 0 0 0;">Saludos,<br><strong>El equipo de BLXK Studio</strong></p>
                          </td>
                        </tr>
                        <tr>
                          <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="color: #9ca3af; font-size: 12px; margin: 0;">© 2025 BLXK Studio. Todos los derechos reservados.</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
              </html>
            `,
          });
          
          if (emailError) {
            console.error('[Izipay Webhook] Failed to send credentials email:', JSON.stringify(emailError, null, 2));
          } else {
            console.log('[Izipay Webhook] Credentials email sent successfully:', emailData);
          }
        } catch (emailException) {
          console.error('[Izipay Webhook] Exception sending email:', emailException);
        }
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
