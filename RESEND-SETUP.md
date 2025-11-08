# 📧 Configuración de Resend para envío de emails

## 🚀 Pasos para configurar Resend

### 1. Crear cuenta en Resend

1. Ve a [https://resend.com](https://resend.com)
2. Crea una cuenta gratuita
3. Verifica tu email

### 2. Agregar y verificar tu dominio

1. En el dashboard de Resend, ve a **Domains**
2. Haz clic en **Add Domain**
3. Ingresa tu dominio: `blxkstudio.com`
4. Copia los registros DNS que te proporciona Resend
5. Agrega estos registros en tu proveedor de DNS (Cloudflare, GoDaddy, etc.):

```
Tipo: TXT
Nombre: @
Valor: [el valor que te da Resend]

Tipo: MX
Nombre: @
Valor: feedback-smtp.us-east-1.amazonses.com
Prioridad: 10
```

6. Espera a que se verifique (puede tomar hasta 48 horas, pero usualmente es inmediato)

### 3. Obtener API Key

1. En el dashboard de Resend, ve a **API Keys**
2. Haz clic en **Create API Key**
3. Dale un nombre: `Production` o `Development`
4. Selecciona permisos: **Send emails**
5. Copia la API key (solo se muestra una vez)

### 4. Agregar API Key a las variables de entorno

Agrega esta línea a tu archivo `.env.local`:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 5. Actualizar el email "from" en el código

Edita el archivo `lib/resend.ts` y cambia la línea:

```typescript
from: 'BLXK Studio <noreply@blxkstudio.com>',
```

Por tu dominio verificado:

```typescript
from: 'BLXK Studio <noreply@tudominio.com>',
```

---

## 🧪 Probar el envío de emails

### Opción 1: Usar el dominio de prueba (sin verificar dominio)

Si aún no has verificado tu dominio, Resend te permite enviar emails de prueba usando:

```typescript
from: 'onboarding@resend.dev',
```

**Limitaciones:**
- Solo puedes enviar a tu propio email
- No funciona en producción
- Máximo 100 emails/día

### Opción 2: Verificar dominio (recomendado para producción)

Sigue los pasos 1-5 de arriba para verificar tu dominio y poder enviar emails a cualquier dirección.

---

## 📝 Ejemplo de uso

El sistema ya está configurado para enviar emails automáticamente cuando:

1. Un usuario realiza un pago exitoso
2. No tiene cuenta registrada
3. El webhook crea la cuenta con contraseña temporal
4. Se envía un email con:
   - Correo electrónico
   - Contraseña temporal
   - Link de inicio de sesión
   - Instrucciones

---

## 🎨 Personalizar el email

El template del email está en `lib/resend.ts` en la función `sendCredentialsEmail`.

Puedes personalizar:
- **Colores:** Cambia los valores hexadecimales (#10b981, etc.)
- **Logo:** Agrega tu logo en el header
- **Texto:** Modifica el contenido del mensaje
- **Footer:** Actualiza la información de contacto

---

## 📊 Monitorear emails enviados

1. Ve al dashboard de Resend
2. Haz clic en **Logs**
3. Verás todos los emails enviados con:
   - Estado (delivered, bounced, etc.)
   - Destinatario
   - Fecha y hora
   - Errores (si los hay)

---

## 🔍 Troubleshooting

### Error: "API key is invalid"
- Verifica que copiaste la API key correctamente
- Asegúrate de que está en `.env.local`
- Reinicia el servidor: `npm run dev`

### Error: "Domain not verified"
- Verifica que agregaste los registros DNS correctamente
- Espera hasta 48 horas para la verificación
- Usa `onboarding@resend.dev` para pruebas mientras tanto

### Email no llega
- Revisa la carpeta de spam
- Verifica el email en los logs de Resend
- Asegúrate de que el dominio está verificado

### Error: "Rate limit exceeded"
- Plan gratuito: 100 emails/día
- Plan Pro: 50,000 emails/mes
- Considera actualizar tu plan si necesitas más

---

## 💰 Precios de Resend

### Plan Gratuito
- ✅ 3,000 emails/mes
- ✅ 1 dominio verificado
- ✅ API completa
- ✅ Logs por 7 días

### Plan Pro ($20/mes)
- ✅ 50,000 emails/mes
- ✅ Dominios ilimitados
- ✅ Logs por 30 días
- ✅ Soporte prioritario

---

## ✅ Checklist de configuración

- [ ] Cuenta de Resend creada
- [ ] Dominio agregado y verificado
- [ ] API Key obtenida
- [ ] `RESEND_API_KEY` agregada a `.env.local`
- [ ] Email "from" actualizado en `lib/resend.ts`
- [ ] Servidor reiniciado
- [ ] Email de prueba enviado exitosamente

---

## 🔗 Links útiles

- **Dashboard de Resend:** https://resend.com/dashboard
- **Documentación:** https://resend.com/docs
- **Verificar dominio:** https://resend.com/docs/dashboard/domains/introduction
- **API Reference:** https://resend.com/docs/api-reference/introduction

---

**Fecha:** 2025-11-08  
**Versión:** 1.0
