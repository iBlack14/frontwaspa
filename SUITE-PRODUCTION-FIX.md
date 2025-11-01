# 🔧 Diagnóstico y Solución: Suite no funciona en Producción

## 📊 Análisis del Problema

### ¿Qué está pasando?
La creación de instancias N8N funciona en **localhost** pero falla en **producción (Azure + Easypanel)**.

### Flujo de Creación Actual:
```
Frontend (Next.js) 
    ↓
/api/suite/create-n8n (Next.js API Route)
    ↓
Backend (Express/FastAPI) - NEXT_PUBLIC_BACKEND_URL
    ↓
Docker/Easypanel API
```

## 🔍 Causas Probables

### 1. **Variables de Entorno Faltantes o Incorrectas**

#### En el Frontend (Easypanel):
```env
NEXT_PUBLIC_BACKEND_URL=https://tu-backend.dominio.com
EASYPANEL_BASE_DOMAIN=1mrj9n.easypanel.host
```

#### En el Backend:
```env
EASYPANEL_API_URL=https://api.easypanel.io
EASYPANEL_API_KEY=tu_api_key_aqui
EASYPANEL_PROJECT_ID=tu_project_id
```

### 2. **Problemas de Conectividad**
- El frontend no puede alcanzar el backend
- El backend no puede alcanzar la API de Easypanel
- Problemas de CORS entre frontend y backend

### 3. **Problemas de Autenticación**
- API Key de Easypanel incorrecta o expirada
- Permisos insuficientes en Easypanel

### 4. **Timeout en Producción**
```javascript
// En create-n8n.js línea 134
timeout: 30000, // 30 segundos - puede ser insuficiente
```

## ✅ Soluciones Paso a Paso

### **Solución 1: Verificar Variables de Entorno**

#### A. En Easypanel (Frontend):
1. Ve a tu proyecto frontend en Easypanel
2. Navega a **Environment Variables**
3. Asegúrate de tener:

```env
# Backend URL - CRÍTICO
NEXT_PUBLIC_BACKEND_URL=https://tu-backend-url.com

# Dominio base de Easypanel
EASYPANEL_BASE_DOMAIN=1mrj9n.easypanel.host

# Supabase (si no están)
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# NextAuth
NEXTAUTH_URL=https://tu-frontend-url.com
NEXTAUTH_SECRET=tu_secret_aqui
```

#### B. En Easypanel (Backend):
1. Ve a tu proyecto backend en Easypanel
2. Navega a **Environment Variables**
3. Asegúrate de tener:

```env
# Easypanel API
EASYPANEL_API_URL=https://api.easypanel.io
EASYPANEL_API_KEY=tu_api_key
EASYPANEL_PROJECT_ID=tu_project_id

# O si usas Docker directo
DOCKER_HOST=unix:///var/run/docker.sock

# Supabase
SUPABASE_URL=tu_supabase_url
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### **Solución 2: Verificar Conectividad**

#### Prueba 1: Verificar que el backend está accesible
```bash
# Desde tu navegador o terminal
curl https://tu-backend-url.com/health

# Debería responder con algo como:
{"status": "ok", "timestamp": "..."}
```

#### Prueba 2: Verificar desde el frontend
Agrega un endpoint de prueba en el frontend:

```javascript
// pages/api/test-backend.js
export default async function handler(req, res) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    
    if (!backendUrl) {
      return res.status(500).json({ 
        error: 'NEXT_PUBLIC_BACKEND_URL no configurado' 
      });
    }

    const response = await fetch(`${backendUrl}/health`);
    const data = await response.json();
    
    return res.status(200).json({ 
      success: true, 
      backend_url: backendUrl,
      backend_response: data 
    });
  } catch (error) {
    return res.status(500).json({ 
      error: error.message,
      backend_url: process.env.NEXT_PUBLIC_BACKEND_URL 
    });
  }
}
```

Luego visita: `https://tu-frontend.com/api/test-backend`

### **Solución 3: Aumentar Timeout y Mejorar Manejo de Errores**

Actualiza `pages/api/suite/create-n8n.js`:

```javascript
// Línea 134 - Aumentar timeout
const dockerResponse = await axios.post(
  `${backendUrl}/api/suite/create-n8n`,
  {
    service_name: service_name,
    user_id: session.id,
    memory: selectedPlanConfig.memory,
    cpu: selectedPlanConfig.cpu,
    plan: plan
  },
  {
    timeout: 120000, // 2 minutos en lugar de 30 segundos
    headers: { 'Content-Type': 'application/json' }
  }
);
```

### **Solución 4: Agregar Logs Detallados**

Actualiza el manejo de errores para obtener más información:

```javascript
} catch (dockerError) {
  console.error('Docker API call failed:', {
    message: dockerError.message,
    response: dockerError.response?.data,
    status: dockerError.response?.status,
    backend_url: backendUrl,
    service_name: service_name
  });
  
  // ... resto del código
}
```

### **Solución 5: Verificar Permisos de Easypanel**

1. Ve a Easypanel Dashboard
2. Navega a **Settings** → **API Keys**
3. Verifica que tu API Key tenga permisos para:
   - Crear servicios
   - Gestionar contenedores
   - Acceder a Docker

### **Solución 6: Alternativa - Crear Directamente con Docker**

Si Easypanel API no funciona, puedes crear contenedores directamente con Docker:

```javascript
// En el backend
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function createN8NContainer(serviceName, memory, cpu) {
  const command = `
    docker run -d \
      --name ${serviceName} \
      --memory=${memory} \
      --cpus=${cpu / 1024} \
      -e N8N_BASIC_AUTH_ACTIVE=true \
      -e N8N_BASIC_AUTH_USER=admin \
      -e N8N_BASIC_AUTH_PASSWORD=${generatePassword()} \
      -p 0:5678 \
      --restart unless-stopped \
      n8nio/n8n:latest
  `;
  
  const { stdout, stderr } = await execPromise(command);
  return stdout.trim(); // Container ID
}
```

## 🚀 Plan de Acción Recomendado

### Paso 1: Verificación Inmediata
```bash
# 1. Verifica que el backend esté corriendo
curl https://tu-backend-url.com/health

# 2. Verifica las variables de entorno en Easypanel
# Frontend: Settings → Environment Variables
# Backend: Settings → Environment Variables
```

### Paso 2: Agregar Endpoint de Diagnóstico
Crea `pages/api/suite/diagnose.js`:

```javascript
export default async function handler(req, res) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const baseDomain = process.env.EASYPANEL_BASE_DOMAIN;
  
  const diagnostics = {
    backend_url: backendUrl || 'NOT_SET',
    base_domain: baseDomain || 'NOT_SET',
    backend_reachable: false,
    error: null
  };

  if (backendUrl) {
    try {
      const response = await fetch(`${backendUrl}/health`, { 
        timeout: 5000 
      });
      diagnostics.backend_reachable = response.ok;
      diagnostics.backend_status = response.status;
    } catch (error) {
      diagnostics.error = error.message;
    }
  }

  return res.status(200).json(diagnostics);
}
```

Visita: `https://tu-frontend.com/api/suite/diagnose`

### Paso 3: Revisar Logs
```bash
# En Easypanel, ve a:
# Tu Proyecto → Logs → Application Logs

# Busca errores relacionados con:
# - "Docker API call failed"
# - "NEXT_PUBLIC_BACKEND_URL"
# - "timeout"
# - "ECONNREFUSED"
```

## 📝 Checklist de Verificación

- [ ] `NEXT_PUBLIC_BACKEND_URL` está configurado en el frontend
- [ ] El backend está corriendo y accesible
- [ ] Las API Keys de Easypanel son correctas
- [ ] El timeout es suficiente (120 segundos)
- [ ] Los logs muestran el error específico
- [ ] El dominio base de Easypanel es correcto
- [ ] Supabase está configurado correctamente
- [ ] No hay problemas de CORS

## 🆘 Necesitas Ayuda Adicional?

Si después de seguir estos pasos el problema persiste:

1. **Comparte los logs**: Copia los logs de error de Easypanel
2. **Verifica la respuesta de diagnóstico**: Visita `/api/suite/diagnose`
3. **Prueba el endpoint de test**: Visita `/api/test-backend`
4. **Revisa las variables**: Asegúrate de que todas estén configuradas

## 📞 Siguiente Paso

Dime:
1. ¿Cuál es la URL de tu backend en producción?
2. ¿Qué error específico ves en los logs de Easypanel?
3. ¿El backend está corriendo correctamente?

Con esta información puedo darte una solución más específica.
