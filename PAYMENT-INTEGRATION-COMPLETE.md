# 🎉 Integración Completa de Pagos con Izipay

## ✅ Lo que se ha implementado:

### 1. **Frontend - Modal de Pago**
- ✅ Modal profesional con diseño moderno
- ✅ Formulario de pago embebido de Izipay
- ✅ Estados de carga y procesamiento
- ✅ Modal de éxito con animación
- ✅ Redirección a login después del pago

### 2. **Backend - API Endpoints**
- ✅ `/api/payment/create-token` - Genera token de pago
- ✅ `/api/payment/webhook` - Recibe notificaciones de Izipay
- ✅ Validación de firma HMAC
- ✅ Actualización automática de base de datos

### 3. **Base de Datos**
- ✅ Tabla `payments` para registrar pagos
- ✅ Actualización de `profiles` con plan y fecha de expiración
- ✅ Políticas RLS configuradas

---

## 📋 Pasos para completar la integración:

### Paso 1: Crear la tabla de pagos en Supabase

1. Ve a tu proyecto en Supabase
2. Abre el **SQL Editor**
3. Ejecuta el archivo `PAYMENT-TABLE-SCHEMA.sql`:

```sql
-- Copiar y pegar el contenido de PAYMENT-TABLE-SCHEMA.sql
```

### Paso 2: Configurar variables de entorno

Asegúrate de tener estas variables en tu `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key  # ⚠️ IMPORTANTE para el webhook

# Izipay (TEST)
NEXT_PUBLIC_IZIPAY_PUBLIC_KEY=47575197:testpublickey_a3D9ovCVNYiJPdPry70gIGYhzU8aRcLa1iEX72P5CdixI
NEXT_PUBLIC_IZIPAY_ENDPOINT=https://api.micuentaweb.pe
NEXT_PUBLIC_IZIPAY_JS_URL=https://static.micuentaweb.pe/static/js/krypton-client/V4.0/stable/kr-payment-form.min.js
IZIPAY_USERNAME=47575197
IZIPAY_PASSWORD=testpassword_aUfHU1fnUEv66whwWsBctdGPoRzYRnpgYjVv0Wx6vobGR
IZIPAY_HMAC_KEY=ypEXi0Ia8SIpqW4SDQsqDvslpNuBB9M0EEg0h2OYcnUHH
```

### Paso 3: Configurar el webhook en Izipay

1. Inicia sesión en el **Back Office de Izipay**
2. Ve a **Configuración → Reglas de notificación**
3. Configura la URL del webhook:
   ```
   https://connect.blxkstudio.com/api/payment/webhook
   ```
4. Selecciona el método: **POST**
5. Activa las notificaciones para:
   - ✅ Pago exitoso
   - ✅ Pago rechazado
   - ✅ Pago pendiente

### Paso 4: Reiniciar el servidor

```bash
npm run dev
```

---

## 🔄 Flujo completo del pago:

```
1. Usuario hace clic en "Pagar Ahora"
   ↓
2. Se abre el modal de pago
   ↓
3. Frontend llama a /api/payment/create-token
   ↓
4. Backend genera token con Izipay
   ↓
5. Se muestra el formulario de pago
   ↓
6. Usuario ingresa datos de tarjeta
   ↓
7. Usuario hace clic en "PAGAR"
   ↓
8. Izipay procesa el pago
   ↓
9. Si es exitoso:
   - Se muestra modal de éxito
   - Se guarda info en localStorage
   - Redirige a /login
   ↓
10. Izipay envía notificación al webhook
   ↓
11. Webhook guarda el pago en la BD
   ↓
12. Webhook actualiza el perfil del usuario:
    - plan_type: 'premium' o 'basic'
    - status_plan: true
    - plan_expires_at: fecha de expiración
```

---

## 💳 Planes según monto:

| Monto | Plan | Duración |
|-------|------|----------|
| S/ 99 | Premium | 1 mes |
| S/ 49 | Basic | 1 mes |
| < S/ 49 | Basic | 1 mes |

Puedes modificar esta lógica en el webhook (`pages/api/payment/webhook.js` líneas 84-94).

---

## 🧪 Pruebas:

### Tarjetas de prueba:

**✅ Pago exitoso:**
```
Número: 4970 1000 0000 0003
Vencimiento: 12/25
CVV: 123
```

**❌ Pago rechazado:**
```
Número: 4970 1000 0000 0004
Vencimiento: 12/25
CVV: 123
```

### Verificar en Supabase:

Después de un pago exitoso, verifica:

1. **Tabla `payments`:**
   ```sql
   SELECT * FROM payments ORDER BY created_at DESC LIMIT 5;
   ```

2. **Tabla `profiles`:**
   ```sql
   SELECT username, plan_type, status_plan, plan_expires_at 
   FROM profiles 
   WHERE plan_type != 'free';
   ```

---

## 🔍 Logs para debugging:

### Frontend (Consola del navegador):
```
[Izipay] Creating payment token with: {...}
[Izipay] Token response: {...}
[Izipay] Form ready
[Izipay] Payment submitted: {...}
```

### Backend (Terminal):
```
[Izipay API] Request received: {...}
[Izipay API] Using credentials: {...}
[Izipay] Token created successfully: {...}
[Izipay Webhook] Payment received: {...}
[Izipay Webhook] Payment saved: {...}
[Izipay Webhook] Profile updated: {...}
```

---

## 🚨 Problemas comunes:

### 1. Error: "User not found" en el webhook
**Causa:** El email del pago no coincide con ningún usuario registrado.
**Solución:** Asegúrate de que el usuario esté registrado antes de pagar.

### 2. Error: "Invalid signature" en el webhook
**Causa:** La clave HMAC no es correcta.
**Solución:** Verifica que `IZIPAY_HMAC_KEY` sea correcta.

### 3. Error: "Cannot read property 'users' of undefined"
**Causa:** No tienes configurada la `SUPABASE_SERVICE_ROLE_KEY`.
**Solución:** Agrega la variable de entorno.

### 4. El webhook no se ejecuta
**Causa:** La URL del webhook no está configurada en Izipay.
**Solución:** Configura la URL en el Back Office de Izipay.

---

## 📊 Próximas mejoras (opcional):

1. **Email de confirmación:**
   - Enviar email al usuario después del pago
   - Incluir detalles del plan y fecha de expiración

2. **Dashboard de pagos:**
   - Mostrar historial de pagos del usuario
   - Permitir descargar facturas

3. **Renovación automática:**
   - Implementar suscripciones recurrentes
   - Notificar antes de que expire el plan

4. **Webhooks adicionales:**
   - Manejar pagos rechazados
   - Manejar reembolsos

5. **Producción:**
   - Cambiar credenciales de TEST a PRODUCCIÓN
   - Configurar SSL en el webhook
   - Agregar más validaciones de seguridad

---

## ✅ Checklist final:

- [ ] Tabla `payments` creada en Supabase
- [ ] Variables de entorno configuradas (incluyendo `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] Webhook configurado en Izipay Back Office
- [ ] Servidor reiniciado
- [ ] Pago de prueba realizado exitosamente
- [ ] Verificado que se guarda en la tabla `payments`
- [ ] Verificado que se actualiza el perfil del usuario
- [ ] Logs del webhook funcionando correctamente

---

## 🎯 ¡Listo para producción!

Una vez que todo funcione en TEST, solo necesitas:

1. Cambiar las credenciales a las de producción
2. Actualizar la URL del webhook
3. Probar con una tarjeta real
4. ¡Empezar a recibir pagos! 💰

---

**Documentación creada el:** 2025-11-08  
**Versión:** 1.0  
**Autor:** Cascade AI
