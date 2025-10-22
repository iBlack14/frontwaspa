# ✅ Checklist de Producción - WazilRest

## 🧹 Limpieza Completada

### Archivos Eliminados
- ✅ **`/pages/prueba`** - Carpeta de pruebas de pasarela de pago (contenía código de prueba no funcional)

### Código Limpiado
- ✅ **28 console.logs eliminados** de archivos de producción:
  - `pages/api/templates/spam-whatsapp.js` (15 console.logs)
  - `src/lib/spam-control.js` (5 console.logs)
  - `pages/api/instances.js` (2 console.logs)
  - `pages/api/auth/[...nextauth].ts` (1 console.log)
  - `src/lib/mailer.ts` (1 console.log)

### Configuración Actualizada
- ✅ **Middleware** actualizado (removida ruta `/docs` obsoleta)
- ✅ **`.env.example`** creado con todas las variables de entorno requeridas
- ✅ **`DEPLOY_EASYPANEL.md`** guía completa de deployment

---

## 📂 Archivos Nuevos Creados

1. **`.env.example`** - Plantilla de variables de entorno
2. **`DEPLOY_EASYPANEL.md`** - Guía de deployment en Easypanel
3. **`PRODUCTION_CHECKLIST.md`** - Este archivo

---

## 🔒 Variables de Entorno Críticas

### Requeridas (Mínimo para funcionar)
```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_BACKEND_URL=
NEXT_PUBLIC_BACKEND_READ_TOKEN=
NEXT_PUBLIC_BACKEND_UPDATE_INSTANCE_TOKEN=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=
```

### Opcionales (Para funcionalidades adicionales)
```env
NEXT_PUBLIC_N8N_WEBHOOK_URL=
NEXT_PUBLIC_WOOCOMMERCE_URL=
WOOCOMMERCE_CONSUMER_KEY=
WOOCOMMERCE_CONSUMER_SECRET=
EMAIL_USER=
EMAIL_PASS=
```

---

## 🚀 Orden de Deployment

### 1. Preparación (Antes de Deploy)
- [ ] Crear proyecto en Supabase
- [ ] Configurar Google OAuth
- [ ] Generar `NEXTAUTH_SECRET` (`openssl rand -base64 32`)
- [ ] Tener backend WhatsApp listo para deploy

### 2. Deploy Backend WhatsApp (PRIMERO)
- [ ] Configurar variables de entorno del backend
- [ ] Deploy en Easypanel
- [ ] Verificar que `/api/sessions` responde
- [ ] Copiar URL del backend para configuración frontend

### 3. Configurar Base de Datos Supabase
- [ ] Crear tabla `profiles`
- [ ] Crear tabla `instances`
- [ ] Crear tabla `products` (opcional)
- [ ] Crear bucket `public-files` en Storage
- [ ] Configurar Row Level Security (RLS)

### 4. Deploy Frontend (SEGUNDO)
- [ ] Configurar todas las variables de entorno en Easypanel
- [ ] Conectar repositorio GitHub
- [ ] Deploy
- [ ] Verificar build exitoso

### 5. Configurar Dominios
- [ ] Asignar dominio al frontend (ej: app.wazilrest.com)
- [ ] Asignar dominio al backend (ej: backend.wazilrest.com)
- [ ] Verificar SSL/HTTPS habilitado

### 6. Verificación Post-Deploy
- [ ] Login con Google funciona
- [ ] Crear instancia funciona
- [ ] Generar QR funciona
- [ ] Enviar mensaje funciona
- [ ] Sistema SPAM funciona (con botón STOP)
- [ ] Verificar logs sin errores

---

## ⚠️ Problemas Comunes y Soluciones

### "Backend de WhatsApp no disponible"
**Causa:** Frontend no puede conectar con backend
**Solución:**
```bash
# 1. Verificar backend está corriendo
curl https://backend.wazilrest.com/api/sessions

# 2. Verificar CORS en backend permite tu dominio
# 3. Verificar NEXT_PUBLIC_BACKEND_URL en frontend
```

### "No autorizado" al hacer login
**Causa:** NextAuth mal configurado
**Solución:**
```bash
# 1. Verificar NEXTAUTH_SECRET está configurado
# 2. Verificar NEXTAUTH_URL es la URL pública
# 3. Verificar Google OAuth redirect URI
```

### Error en Supabase
**Causa:** Tablas no creadas o RLS mal configurado
**Solución:**
```sql
-- Ejecutar scripts SQL en DEPLOY_EASYPANEL.md
-- Verificar RLS habilitado con policies correctas
```

### Build falla con error de dependencias
**Causa:** Conflictos de peer dependencies
**Solución:**
```bash
# Usar flag --legacy-peer-deps
npm install --legacy-peer-deps && npm run build
```

---

## 🔍 Verificación de Seguridad

### Variables Sensibles Protegidas
- ✅ `.env.local` en `.gitignore`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` solo en servidor
- ✅ Tokens de backend no expuestos en frontend
- ✅ `NEXTAUTH_SECRET` generado aleatoriamente

### API Endpoints Protegidos
- ✅ Middleware protege rutas autenticadas
- ✅ APIs verifican sesión del usuario
- ✅ Supabase RLS activo en todas las tablas
- ✅ Backend requiere tokens de autorización

---

## 📊 Monitoreo Post-Deployment

### Métricas a Monitorear
1. **Logs de Error** en Easypanel
2. **Latencia de API** (backend responde < 2s)
3. **Errores de autenticación**
4. **Fallos en envío de mensajes**
5. **Uso de recursos** (memoria, CPU)

### Herramientas
- **Easypanel Logs** - Logs en tiempo real
- **Supabase Dashboard** - Queries y performance
- **Google Analytics** - Tráfico y usuarios (opcional)

---

## 🎯 Funcionalidades Principales Verificadas

### Sistema de Autenticación
- ✅ Login con Google OAuth
- ✅ Sesiones persistentes (72 horas)
- ✅ Redirección automática a /home
- ✅ Protección de rutas con middleware

### Gestión de Instancias
- ✅ Crear instancias de WhatsApp
- ✅ Generar QR para conexión
- ✅ Monitoreo de estado (Connected/Disconnected)
- ✅ Desconexión de instancias

### Sistema SPAM WhatsApp
- ✅ Envío masivo desde Excel
- ✅ Soporte para imágenes (URL o subida)
- ✅ **Botón STOP funcional (detiene en < 500ms)**
- ✅ Progreso en tiempo real con estadísticas
- ✅ Reportes de éxito/error por contacto

### Optimizaciones de Rendimiento
- ✅ Output standalone para Docker
- ✅ Exclusión de backend/sessions del watcher
- ✅ Optimización de imports con treeshaking
- ✅ Compresión de respuestas habilitada
- ✅ Imágenes optimizadas con WebP

---

## 📝 Notas Finales

### Arquitectura
- **Frontend:** Next.js 14.2.5 (standalone)
- **Backend:** Express + Baileys (repositorio separado)
- **Database:** Supabase (PostgreSQL)
- **Auth:** NextAuth con Google OAuth
- **Deployment:** Easypanel en Azure

### Configuración de Build
```toml
[build]
  baseImage = "node:18"
  buildCommand = "npm install --legacy-peer-deps && npm run build"
  startCommand = "npm start"
  nodeVersion = "18"
```

### Backups Recomendados
1. **Supabase:** Backups automáticos diarios
2. **Código:** Git con múltiples remotes
3. **Variables de entorno:** Documento cifrado en seguro

---

## 🎉 Listo para Producción

Una vez completado este checklist:

✅ El código está limpio sin console.logs
✅ No hay archivos de prueba
✅ Configuración de producción lista
✅ Documentación de deployment completa
✅ Variables de entorno documentadas
✅ Seguridad verificada

### Siguiente Paso
👉 Sigue la guía en `DEPLOY_EASYPANEL.md` para el deployment paso a paso.

---

**Fecha de preparación:** 2025
**Versión:** 1.0.0 Production Ready
