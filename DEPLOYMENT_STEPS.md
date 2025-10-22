# 🚀 Pasos para Subir Frontend a Producción

## ✅ Pre-requisitos (Ya completados)
- ✅ Código limpio sin console.logs
- ✅ Variables de entorno configuradas
- ✅ Supabase configurado con tablas

---

## 📦 PASO 1: Subir a GitHub

### 1.1 Abrir PowerShell en el proyecto
```powershell
cd "c:\Users\Via Comunicativa\Downloads\ALONSO\API-WATSAP-main\API-WATSAP-main"
```

### 1.2 Verificar Git
```powershell
# Ver status
git status

# Si no es un repositorio, inicializar:
git init
git branch -M main
```

### 1.3 Agregar archivos y hacer commit
```powershell
# Ver qué se va a subir
git status

# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "feat: proyecto producción ready - limpio y optimizado"
```

### 1.4 Crear repositorio en GitHub
1. Ve a: https://github.com/new
2. Nombre: `wazilrest-frontend` (o el que quieras)
3. **Privado** (recomendado)
4. **NO marques** ningún checkbox
5. Click **"Create repository"**

### 1.5 Conectar y subir
```powershell
# Reemplaza TU_USUARIO con tu usuario real
git remote add origin https://github.com/TU_USUARIO/wazilrest-frontend.git

# Subir
git push -u origin main
```

**Si pide contraseña:** Usa un Personal Access Token de GitHub, no tu contraseña.

---

## 🔧 PASO 2: Configurar en Easypanel

### 2.1 Crear nuevo servicio
1. Ve a Easypanel: http://20.220.17.235:3000
2. Proyecto: **blxk**
3. Click **"+ Servicio"** o **"+ Add Service"**
4. Tipo: **"App"**

### 2.2 Configuración General
```
Name: frontwha
Type: GitHub
Repository: TU_USUARIO/wazilrest-frontend
Branch: main
```

### 2.3 Configuración de Build
```
Build Command: npm install --legacy-peer-deps && npm run build
Start Command: npm start
Port: 3000
```

### 2.4 Variables de Entorno

Copia estas variables en la sección **"Environment"**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://blxk-supabase.1mrj9n.easypanel.host
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q
NEXT_PUBLIC_BACKEND_URL=https://blxk-backwha.1mrj9n.easypanel.host/
NEXT_PUBLIC_BACKEND_READ_TOKEN=8fK2mNp9rXwY4zQvL7jH3sT6nBcD1gFe5aW0xE9uV2iR4oP8qJ7yM3kU6hG1bS5t
NEXT_PUBLIC_BACKEND_UPDATE_INSTANCE_TOKEN=3dR9wQ2pL5nK8jH6mF4xV7cB1zT0yU9gE2aW5sO8iP3qR6kJ4hN7lM1bD0vG5fX
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://blxk-n8n.1mrj9n.easypanel.host/webhook/create-instance
N8N_CREATE_INSTANCE_WEBHOOK=https://blxk-n8n.1mrj9n.easypanel.host/webhook/create-n8n-instance
NEXTAUTH_URL=https://blxk-frontwha.1mrj9n.easypanel.host
NEXTAUTH_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=
EASYPANEL_BASE_DOMAIN=1mrj9n.easypanel.host
DOCKER_API_URL=https://blxk-dockern8n.1mrj9n.easypanel.host
CREATE_INSTANCES_MANUALLY=true
```

### 2.5 Configurar Dominio
1. En la app → **"Domains"**
2. Click **"+ Add Domain"**
3. Usa: `blxk-frontwha.1mrj9n.easypanel.host`

### 2.6 ¡Deploy!
1. Click **"Save"** / **"Guardar"**
2. Click **"Deploy"** / **"Implementar"**
3. Espera 3-5 minutos

---

## ✅ PASO 3: Verificar

### Cuando termine el build:

1. **Abrir la app:**
   ```
   https://blxk-frontwha.1mrj9n.easypanel.host
   ```

2. **Verificar login:**
   - Debería aparecer la página de login
   - Intenta hacer login con email/password

3. **Revisar logs si hay errores:**
   - Easypanel → Tu app → **"Logs"**

---

## 🐛 Si algo falla:

### Build falla:
- Revisa logs en Easypanel
- Verifica que el comando sea: `npm install --legacy-peer-deps && npm run build`

### "Backend no disponible":
- Verifica que el backend esté corriendo
- Prueba: https://blxk-backwha.1mrj9n.easypanel.host/api/sessions

### Error de autenticación:
- Verifica `NEXTAUTH_URL` apunte a tu dominio correcto
- Limpia cookies del navegador

---

## 🎯 URLs Finales:

```
Frontend: https://blxk-frontwha.1mrj9n.easypanel.host
Backend: https://blxk-backwha.1mrj9n.easypanel.host
Supabase: https://blxk-supabase.1mrj9n.easypanel.host
N8N: https://blxk-n8n.1mrj9n.easypanel.host
```

---

## 🔄 Para actualizar después:

```powershell
# Hacer cambios en el código
git add .
git commit -m "descripción del cambio"
git push origin main

# Easypanel auto-desplegará
```

---

## ✅ Checklist:

```
✅ Código en GitHub
✅ App creada en Easypanel
✅ Variables de entorno configuradas
✅ Dominio configurado
✅ Build exitoso
✅ App funcionando
```

🎉 ¡Listo para producción!
