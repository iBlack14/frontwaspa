# 🛡️ Rate Limiting Implementation Guide

## 📋 Resumen

Sistema completo de **Rate Limiting** implementado con:
- ✅ **Por Usuario (session.id)** - Límites individuales justos
- ✅ **Por IP** - Backup cuando no hay sesión
- ✅ **Por Endpoint** - Límites personalizados por ruta
- ✅ **Persistencia en Supabase** - No se pierde al reiniciar
- ✅ **Limpieza automática** - Cron job cada hora

---

## 🎯 Archivos Creados

### **1. Base de Datos (SQL)**
**Archivo:** `FINAL-DATABASE-SCHEMA.sql` (Sección 16)

**Tablas:**
```sql
- public.anti_ban_counters      -- Contadores anti-ban persistentes
- public.rate_limits            -- Rate limiting por usuario
- public.rate_limits_ip         -- Rate limiting por IP (backup)
```

**Funciones:**
```sql
- get_or_create_anti_ban_counter()  -- Obtener/crear contador con reset automático
- increment_anti_ban_counter()      -- Incrementar mensajes
- record_anti_ban_error()           -- Registrar error
- check_rate_limit()                -- Verificar y aplicar rate limit
- cleanup_inactive_instances()      -- Limpiar instancias > 24h
- cleanup_old_rate_limits()         -- Limpiar rate limits > 7 días
```

### **2. Middleware de Rate Limiting**
**Archivo:** `src/middleware/rate-limit.middleware.js`

**Funciones:**
- `rateLimitByUser()` - Rate limit por usuario autenticado
- `rateLimitByIP()` - Rate limit por IP (fallback)
- `withRateLimit()` - Wrapper para Next.js API routes

### **3. Anti-Ban con Supabase**
**Archivo:** `src/lib/anti-ban-supabase.js`

**Funciones:**
- `getCounters()` - Obtener contadores desde Supabase
- `incrementMessageCount()` - Incrementar contador persistente
- `recordError()` - Registrar error persistente
- `cleanupInactiveInstances()` - Limpieza manual

### **4. Cron Job de Limpieza**
**Archivo:** `pages/api/cron/cleanup.js`

**Tareas:**
- Limpiar instancias inactivas > 24h
- Limpiar rate limits > 7 días
- Limpiar spam_progress completados
- Limpiar chatbot_logs > 30 días

---

## 🔧 Configuración de Límites

### **Límites por Endpoint**

```javascript
const RATE_LIMITS = {
  // Endpoints críticos (más restrictivos)
  '/api/templates/spam-whatsapp': { 
    limit: 10,    // 10 requests
    window: 60    // por hora
  },
  
  '/api/templates/chatbot': { 
    limit: 20,    // 20 requests
    window: 60    // por hora
  },
  
  '/api/instances': { 
    limit: 50,    // 50 requests
    window: 60    // por hora
  },
  
  '/api/templates/assign': { 
    limit: 30,    // 30 requests
    window: 60    // por hora
  },
  
  // Endpoints normales
  '/api/messages': { 
    limit: 100,   // 100 requests
    window: 60    // por hora
  },
  
  // Default para otros endpoints
  'default': { 
    limit: 200,   // 200 requests
    window: 60    // por hora
  },
};
```

---

## 📝 Cómo Aplicar Rate Limiting

### **Opción 1: Wrapper (Recomendado)**

```javascript
// pages/api/templates/spam-whatsapp.js
import { withRateLimit } from '@/middleware/rate-limit.middleware';

async function handler(req, res) {
  // Tu código aquí
  return res.json({ success: true });
}

export default withRateLimit(handler);
```

### **Opción 2: Middleware Manual**

```javascript
// pages/api/templates/chatbot.js
import { rateLimitByUser } from '@/middleware/rate-limit.middleware';

export default async function handler(req, res) {
  // Aplicar rate limiting
  await new Promise((resolve, reject) => {
    rateLimitByUser(req, res, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
  
  // Tu código aquí
  return res.json({ success: true });
}
```

### **Opción 3: Verificación Manual**

```javascript
// Para casos especiales
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth/next';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  // Verificar rate limit
  const { data } = await supabaseAdmin.rpc('check_rate_limit', {
    p_user_id: session.id,
    p_endpoint: '/api/custom-endpoint',
    p_limit: 50,
    p_window_minutes: 60,
  });
  
  if (!data[0].allowed) {
    return res.status(429).json({
      error: 'Too Many Requests',
      retryAfter: Math.ceil((new Date(data[0].reset_at) - new Date()) / 60000),
    });
  }
  
  // Tu código aquí
}
```

---

## 🚀 Respuestas HTTP

### **Request Exitoso (200)**
```json
{
  "success": true,
  "data": { ... }
}
```

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 2025-11-07T13:00:00.000Z
```

### **Rate Limit Excedido (429)**
```json
{
  "error": "Too Many Requests",
  "message": "Has excedido el límite de 100 requests por 60 minutos",
  "retryAfter": 45,
  "resetAt": "2025-11-07T13:00:00.000Z",
  "currentCount": 105
}
```

---

## ⏰ Configuración de Cron Job

### **Vercel (vercel.json)**
```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 * * * *"
    }
  ]
}
```

### **Variables de Entorno**
```env
CRON_SECRET=tu_secreto_super_seguro_aqui
```

### **Llamada Manual**
```bash
curl -X GET https://tu-dominio.com/api/cron/cleanup \
  -H "Authorization: Bearer tu_secreto_super_seguro_aqui"
```

---

## 📊 Monitoreo

### **Ver Rate Limits de un Usuario**
```sql
SELECT * FROM public.rate_limits
WHERE user_id = 'uuid-del-usuario'
ORDER BY last_request DESC;
```

### **Ver Usuarios Bloqueados**
```sql
SELECT 
  user_id,
  endpoint,
  request_count,
  blocked_until,
  window_start
FROM public.rate_limits
WHERE blocked_until > NOW()
ORDER BY blocked_until DESC;
```

### **Estadísticas de Rate Limiting**
```sql
SELECT 
  endpoint,
  COUNT(*) as total_users,
  SUM(request_count) as total_requests,
  COUNT(*) FILTER (WHERE blocked_until > NOW()) as blocked_users
FROM public.rate_limits
GROUP BY endpoint
ORDER BY total_requests DESC;
```

---

## 🧹 Limpieza Manual

### **Limpiar Instancias Inactivas**
```sql
SELECT cleanup_inactive_instances();
-- Retorna: número de instancias eliminadas
```

### **Limpiar Rate Limits Antiguos**
```sql
SELECT cleanup_old_rate_limits();
-- Retorna: número de registros eliminados
```

### **Resetear Rate Limit de un Usuario**
```sql
DELETE FROM public.rate_limits
WHERE user_id = 'uuid-del-usuario'
AND endpoint = '/api/templates/spam-whatsapp';
```

### **Desbloquear Usuario**
```sql
UPDATE public.rate_limits
SET 
  blocked_until = NULL,
  request_count = 0,
  window_start = NOW()
WHERE user_id = 'uuid-del-usuario';
```

---

## 🔍 Debugging

### **Logs del Middleware**
```
[RATE-LIMIT] Checking rate limit for user: abc-123
[RATE-LIMIT] Endpoint: /api/templates/spam-whatsapp
[RATE-LIMIT] Current count: 8/10
[RATE-LIMIT] ✅ Request allowed
```

### **Logs de Bloqueo**
```
[RATE-LIMIT] ❌ User blocked: abc-123
[RATE-LIMIT] Endpoint: /api/templates/spam-whatsapp
[RATE-LIMIT] Count: 11/10
[RATE-LIMIT] Retry after: 45 minutes
```

---

## 🎯 Mejores Prácticas

### **1. Ajustar Límites Según Plan**
```javascript
// Obtener límite según plan del usuario
const { data: profile } = await supabaseAdmin
  .from('profiles')
  .select('plan_type')
  .eq('id', userId)
  .single();

const limit = profile.plan_type === 'premium' ? 200 : 100;
```

### **2. Whitelist para Admins**
```javascript
// Excluir admins del rate limiting
const { data: profile } = await supabaseAdmin
  .from('profiles')
  .select('is_admin')
  .eq('id', userId)
  .single();

if (profile.is_admin) {
  return next(); // Skip rate limiting
}
```

### **3. Rate Limit Progresivo**
```javascript
// Aumentar límite según antigüedad de cuenta
const accountAge = (Date.now() - new Date(profile.created_at)) / (1000 * 60 * 60 * 24);
const limit = accountAge > 30 ? 200 : 100;
```

---

## 📈 Métricas de Éxito

✅ **Rate limiting activo** en endpoints críticos
✅ **Persistencia** en Supabase (no se pierde)
✅ **Limpieza automática** cada hora
✅ **Headers informativos** en respuestas
✅ **Bloqueo temporal** automático
✅ **Fallback por IP** cuando no hay sesión

---

## 🚨 Troubleshooting

### **Problema: Rate limit no se aplica**
**Solución:**
1. Verificar que el middleware está importado
2. Verificar que la función SQL existe en Supabase
3. Revisar logs del servidor

### **Problema: Usuario bloqueado permanentemente**
**Solución:**
```sql
UPDATE public.rate_limits
SET blocked_until = NULL
WHERE user_id = 'uuid-del-usuario';
```

### **Problema: Cron job no se ejecuta**
**Solución:**
1. Verificar configuración en `vercel.json`
2. Verificar variable `CRON_SECRET`
3. Ejecutar manualmente para probar

---

**Fecha de implementación:** 2025-11-07
**Versión:** 1.0.0
**Estado:** ✅ Producción Ready
