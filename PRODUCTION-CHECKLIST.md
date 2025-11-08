# ✅ Checklist de Producción - BLXK Studio

## 🔐 Seguridad

### Variables de Entorno (Easypanel)

**CRÍTICO - Rotar estas claves antes de producción:**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://blxk-supabase.qn0goj.easypanel.host
NEXT_PUBLIC_SUPABASE_ANON_KEY=<TU_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<TU_SERVICE_ROLE_KEY>  # ⚠️ NUNCA exponer en frontend

# NextAuth
NEXTAUTH_URL=https://connect.blxkstudio.com
NEXTAUTH_SECRET=<GENERAR_NUEVO_SECRET>  # ⚠️ Usar: openssl rand -base64 32

# Izipay - PRODUCCIÓN
NEXT_PUBLIC_IZIPAY_PUBLIC_KEY=<TU_PUBLIC_KEY_PRODUCCION>
NEXT_PUBLIC_IZIPAY_ENDPOINT=https://api.micuentaweb.pe
NEXT_PUBLIC_IZIPAY_JS_URL=https://static.micuentaweb.pe/static/js/krypton-client/V4.0/stable/kr-payment-form.min.js
IZIPAY_USERNAME=<TU_USERNAME_PRODUCCION>
IZIPAY_PASSWORD=<TU_PASSWORD_PRODUCCION>  # ⚠️ Usar clave de PRODUCCIÓN

# Resend
RESEND_API_KEY=<TU_API_KEY>  # ⚠️ Verificar límites de envío

# Backend
NEXT_PUBLIC_BACKEND_URL=https://api.connect.blxkstudio.com
BACKEND_URL=https://api.connect.blxkstudio.com
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://blxk-blxk-n8n.qn0goj.easypanel.host/webhook/create-instance
NEXT_PUBLIC_BACKEND_READ_TOKEN=<GENERAR_NUEVO_TOKEN>

# Sistema
NODE_ENV=production
PORT=3010
```

---

## 🚀 Izipay - Configuración de Producción

### 1. Cambiar de TEST a PRODUCCIÓN

**En Izipay Back Office:**

1. Ve a **Configuración → Modo**
2. Cambia de **TEST** a **PRODUCCIÓN**
3. Obtén las nuevas credenciales:
   - Username de producción
   - Password de producción
   - Public Key de producción

### 2. Configurar Webhook IPN

**URL del webhook:**
```
https://connect.blxkstudio.com/api/payment/webhook
```

**Configuración:**
- Método: POST
- Estado: Activado ✅
- Regla: "URL de notificación al final del pago"

### 3. Verificar dominio en Resend

**Resend Dashboard → Domains:**
- ✅ `blxkstudio.com` debe estar verificado
- ✅ Registros DNS configurados correctamente
- ✅ Email `noreply@blxkstudio.com` funcional

---

## 🗄️ Base de Datos (Supabase)

### Verificar RLS (Row Level Security)

```sql
-- Verificar que RLS esté habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('payments', 'profiles', 'user_subscriptions');

-- Debe retornar rowsecurity = true para todas
```

### Limpiar datos de prueba

```sql
-- Eliminar pagos de prueba
DELETE FROM public.payments WHERE status = 'test' OR order_id LIKE 'ORDER-TEST%';

-- Eliminar usuarios de prueba
DELETE FROM auth.users WHERE email LIKE '%@test.com' OR email LIKE '%@example.com';
```

---

## 📧 Email (Resend)

### Verificar configuración

- [ ] Dominio `blxkstudio.com` verificado
- [ ] Registros DNS (SPF, DKIM, DMARC) configurados
- [ ] Email de prueba enviado y recibido
- [ ] Límites de envío verificados (plan actual)

### Template de email

El email de credenciales está en:
```
pages/api/payment/webhook.js (líneas 120-180)
```

---

## 🔒 Seguridad Adicional

### 1. Rotar claves expuestas

**CRÍTICO:** Las siguientes claves están expuestas en el historial de Git:

```bash
# Rotar en Supabase
SUPABASE_SERVICE_ROLE_KEY

# Rotar en NextAuth
NEXTAUTH_SECRET

# Rotar en Backend
NEXT_PUBLIC_BACKEND_READ_TOKEN
```

### 2. Configurar CORS

Verificar que el backend solo acepte requests de:
```
https://connect.blxkstudio.com
```

### 3. Rate Limiting

Implementar rate limiting en:
- `/api/payment/create-token`
- `/api/payment/webhook`

---

## 📊 Monitoreo

### Logs importantes

**Webhook exitoso:**
```
[Izipay Webhook] Webhook called
[Izipay Webhook] Payment received
[Izipay Webhook] User created with temp password
[Izipay Webhook] Credentials email sent successfully
[Izipay Webhook] Payment saved
[Izipay Webhook] Profile updated
```

**Errores a monitorear:**
```
[Izipay Webhook] Invalid signature
[Izipay Webhook] Failed to send credentials email
[Izipay Webhook] Error creating user
```

### Herramientas recomendadas

- **Sentry** para error tracking
- **LogRocket** para session replay
- **Uptime Robot** para monitoreo de disponibilidad

---

## 🧪 Testing Pre-Producción

### 1. Pago de prueba (modo TEST)

- [ ] Crear pago con tarjeta de prueba
- [ ] Verificar que llega el webhook
- [ ] Verificar que se crea el usuario
- [ ] Verificar que llega el email
- [ ] Verificar que se puede iniciar sesión

### 2. Pago real (modo PRODUCCIÓN)

- [ ] Hacer un pago real de $1 o mínimo
- [ ] Verificar todo el flujo
- [ ] Hacer refund si es necesario

---

## 📝 Tareas Pendientes

### Alta prioridad

- [ ] Crear página `/change-password` para cambio obligatorio
- [ ] Actualizar login para detectar `must_change_password`
- [ ] Implementar idempotencia en webhook (evitar duplicados)
- [ ] Agregar reintento de email si falla
- [ ] Rotar todas las claves sensibles

### Media prioridad

- [ ] Agregar tests end-to-end
- [ ] Documentar procedimiento de recuperación
- [ ] Revisar y ajustar RLS de todas las tablas
- [ ] Implementar logging estructurado

### Baja prioridad

- [ ] Eliminar archivos de prueba (`test-webhook.js`, `webhook.config.js`)
- [ ] Configurar alias `@/` en tsconfig
- [ ] Optimizar imágenes (instalar `sharp`)

---

## 🚀 Deployment

### Comando de deploy

```bash
git add .
git commit -m "chore: preparar para producción"
git push origin main
```

### Verificar después del deploy

1. **Healthcheck:** https://connect.blxkstudio.com/api/health
2. **Test webhook:** https://connect.blxkstudio.com/api/payment/test-webhook
3. **Logs:** Easypanel → Logs (sin errores)

---

## 📞 Contactos de Emergencia

**Izipay Soporte:**
- Email: soporte@izipay.pe
- Teléfono: [AGREGAR]

**Resend Soporte:**
- Email: support@resend.com
- Docs: https://resend.com/docs

**Supabase Soporte:**
- Dashboard: https://supabase.com/dashboard/support
- Discord: https://discord.supabase.com

---

## ✅ Checklist Final

Antes de lanzar a producción:

- [ ] Todas las variables de entorno configuradas
- [ ] Izipay en modo PRODUCCIÓN
- [ ] Webhook IPN configurado y probado
- [ ] Dominio de email verificado
- [ ] Claves sensibles rotadas
- [ ] Datos de prueba eliminados
- [ ] RLS verificado en todas las tablas
- [ ] Pago de prueba exitoso
- [ ] Logs sin errores
- [ ] Documentación actualizada

---

**Fecha de última actualización:** 2025-11-08
**Versión:** 1.0.0
