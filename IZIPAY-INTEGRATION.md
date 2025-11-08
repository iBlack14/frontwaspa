# 🔐 Integración de Izipay

## ✅ Archivos creados:

1. **Frontend:**
   - `components/payment/IzipayModal.tsx` - Modal de pago
   - `pages/components/landing/PricingSection.tsx` - Actualizado con modal

2. **Backend (API):**
   - `pages/api/payment/create-token.js` - Genera token de pago
   - `pages/api/payment/webhook.js` - Recibe notificaciones de pago

3. **Configuración:**
   - `.env.izipay.example` - Ejemplo de variables de entorno

## 📋 Pasos para activar:

### 1. Agregar variables de entorno

Copia el contenido de `.env.izipay.example` a tu archivo `.env.local`:

```bash
# Frontend
NEXT_PUBLIC_IZIPAY_PUBLIC_KEY=47575197:testpublickey_a3D9ovCVNYiJPdPry70gIGYhzU8aRcLa1iEX72P5CdixI
NEXT_PUBLIC_IZIPAY_ENDPOINT=https://api.micuentaweb.pe
NEXT_PUBLIC_IZIPAY_JS_URL=https://static.micuentaweb.pe/static/js/krypton-client/V4.0/stable/kr-payment-form.min.js

# Backend
IZIPAY_USERNAME=47575197
IZIPAY_PASSWORD=testpassword_aUfHU1fnUEv66whwWsBctdGPoRzYRnpgYjVv0Wx6vobGR
IZIPAY_HMAC_KEY=ypEXi0Ia8SIpqW4SDQsqDvslpNuBB9M0EEg0h2OYcnUHH
```

### 2. Configurar webhook en Izipay

1. Entra al Back Office de Izipay
2. Ve a **Configuración → Reglas de notificación**
3. Configura la URL de notificación:
   ```
   https://connect.blxkstudio.com/api/payment/webhook
   ```
4. Activa la regla

### 3. Reiniciar el frontend

```bash
npm run dev
# o en producción
npm run build && npm start
```

## 🧪 Probar la integración:

1. Ve al landing page: `https://connect.blxkstudio.com`
2. Haz clic en "Pagar Ahora" en el plan Pro
3. Se abrirá el modal de pago de Izipay
4. Usa una tarjeta de prueba:
   - **Número**: 4970 1000 0000 0003
   - **Vencimiento**: Cualquier fecha futura
   - **CVV**: 123

## 📊 Flujo de pago:

1. Usuario hace clic en "Pagar Ahora"
2. Se abre el modal de Izipay
3. Frontend llama a `/api/payment/create-token` para generar token
4. Se muestra el formulario de Izipay
5. Usuario ingresa datos de tarjeta
6. Izipay procesa el pago
7. Izipay envía notificación a `/api/payment/webhook`
8. Backend actualiza la suscripción del usuario

## ⚠️ Pendientes:

1. **Actualizar el webhook** para guardar en Supabase
2. **Agregar email de confirmación** después del pago
3. **Manejar errores de pago** en el frontend
4. **Agregar página de éxito** después del pago
5. **Cambiar a credenciales de producción** cuando estés listo

## 🔒 Seguridad:

- ✅ Las credenciales privadas están en variables de entorno
- ✅ El webhook verifica la firma HMAC
- ✅ El formulario de pago es embebido de Izipay (PCI compliant)
- ✅ No guardamos datos de tarjetas

## 📞 Soporte:

Si tienes problemas:
1. Revisa los logs del navegador (F12)
2. Revisa los logs del servidor
3. Verifica que las credenciales sean correctas
4. Contacta a soporte de Izipay si es necesario
