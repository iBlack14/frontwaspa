import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'Gmail', // o "Outlook", "Yahoo", etc. según tu proveedor
  auth: {
    user: process.env.EMAIL_USER, // tu correo
    pass: process.env.EMAIL_PASS, // contraseña o app password
  },
});

export async function sendMail(to: string, subject: string, html: string) {
  const info = await transporter.sendMail({
    from: `"Tu Proyecto" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });

  return info;
}
