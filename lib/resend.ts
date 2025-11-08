import { Resend } from 'resend';

// Inicializar Resend con la API key
export const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Enviar email con credenciales temporales
 */
export async function sendCredentialsEmail(
  email: string,
  tempPassword: string,
  planName: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'BLXK Studio <noreply@blxkstudio.com>',
      to: [email],
      subject: '🎉 ¡Bienvenido a BLXK Studio! - Tus credenciales de acceso',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bienvenido a BLXK Studio</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                        ¡Bienvenido a BLXK Studio! 🎉
                      </h1>
                      <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">
                        Tu pago ha sido procesado exitosamente
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hola,
                      </p>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Gracias por tu compra del <strong>Plan ${planName}</strong>. Hemos creado tu cuenta y aquí están tus credenciales de acceso:
                      </p>
                      
                      <!-- Credentials Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 2px solid #10b981; border-radius: 12px; margin: 30px 0;">
                        <tr>
                          <td style="padding: 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding-bottom: 15px;">
                                  <p style="color: #6b7280; font-size: 14px; margin: 0 0 5px 0; font-weight: 600;">
                                    📧 Correo electrónico:
                                  </p>
                                  <p style="color: #111827; font-size: 16px; margin: 0; font-family: 'Courier New', monospace; background-color: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
                                    ${email}
                                  </p>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <p style="color: #6b7280; font-size: 14px; margin: 0 0 5px 0; font-weight: 600;">
                                    🔑 Contraseña temporal:
                                  </p>
                                  <p style="color: #111827; font-size: 16px; margin: 0; font-family: 'Courier New', monospace; background-color: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
                                    ${tempPassword}
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Warning Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; margin: 20px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;">
                              <strong>⚠️ Importante:</strong> Por seguridad, deberás cambiar tu contraseña temporal en el primer inicio de sesión.
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                        <tr>
                          <td align="center">
                            <a href="https://connect.blxkstudio.com/login" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                              Iniciar sesión ahora
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                        Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.
                      </p>
                      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 10px 0 0 0;">
                        Saludos,<br>
                        <strong>El equipo de BLXK Studio</strong>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; font-size: 12px; margin: 0 0 10px 0;">
                        © 2025 BLXK Studio. Todos los derechos reservados.
                      </p>
                      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        Este es un correo automático, por favor no respondas a este mensaje.
                      </p>
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

    if (error) {
      console.error('[Resend] Error sending email:', error);
      return { success: false, error };
    }

    console.log('[Resend] Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('[Resend] Exception sending email:', error);
    return { success: false, error };
  }
}
