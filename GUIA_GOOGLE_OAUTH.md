# 🔑 Guía: Obtener Google OAuth Keys

## 📍 Paso 1: Ir a Google Cloud Console

🌐 **URL:** https://console.cloud.google.com

---

## 📍 Paso 2: Crear Proyecto (si no tienes)

1. Click en el selector de proyectos (arriba)
2. Click **"NUEVO PROYECTO"**
3. Nombre: `WazilRest` (o el que quieras)
4. Click **"CREAR"**
5. Espera 30 segundos y selecciona el proyecto

---

## 📍 Paso 3: Configurar Pantalla de Consentimiento

1. **Menú lateral** → **APIs y servicios** → **Pantalla de consentimiento de OAuth**

2. Selecciona: **"Externo"** → Click **"CREAR"**

3. **Información de la app:**
   ```
   Nombre de la aplicación: WazilRest
   Correo de asistencia: tu-email@gmail.com
   Logotipo: (opcional, puedes omitir)
   ```

4. **Información de contacto del desarrollador:**
   ```
   Correo: tu-email@gmail.com
   ```

5. Click **"GUARDAR Y CONTINUAR"**

6. **Ámbitos (Scopes):**
   - Click **"GUARDAR Y CONTINUAR"** (no agregues nada)

7. **Usuarios de prueba:**
   - Click **"+ ADD USERS"**
   - Agrega tu email (para poder probar)
   - Click **"AGREGAR"**
   - Click **"GUARDAR Y CONTINUAR"**

8. **Resumen:**
   - Click **"VOLVER AL PANEL"**

---

## 📍 Paso 4: Crear Credenciales OAuth

1. **Menú lateral** → **APIs y servicios** → **Credenciales**

2. Click en **"+ CREAR CREDENCIALES"** (arriba)

3. Selecciona: **"ID de cliente de OAuth 2.0"**

4. **Configuración:**
   ```
   Tipo de aplicación: Aplicación web
   Nombre: WazilRest Web Client
   ```

5. **Orígenes de JavaScript autorizados:**
   ```
   http://localhost:3000
   https://blxk-frontwha.1mrj9n.easypanel.host
   ```
   (Click "+ AGREGAR URI" para cada uno)

6. **URIs de redirección autorizados:**
   ```
   http://localhost:3000/api/auth/callback/google
   https://blxk-frontwha.1mrj9n.easypanel.host/api/auth/callback/google
   ```
   (Click "+ AGREGAR URI" para cada uno)

7. Click **"CREAR"**

---

## 📍 Paso 5: Copiar las Credenciales

Aparecerá un popup con tus credenciales:

```
Tu ID de cliente:
123456789-abcdefghijklmnop.apps.googleusercontent.com

Tu secreto de cliente:
GOCSPX-xxxxxxxxxxxxxxxxxx
```

**¡COPIA ESTOS VALORES AHORA!**

---

## 📍 Paso 6: Agregar a .env.local

Abre tu archivo `.env.local` y reemplaza las líneas 16 y 17:

**ANTES:**
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=
```

**DESPUÉS:**
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxx
```

---

## ✅ Verificar que Funciona

1. Guarda el archivo `.env.local`
2. **Reinicia tu servidor de desarrollo:**
   ```bash
   # Detén el servidor (Ctrl+C)
   npm run dev
   ```
3. Ve a: http://localhost:3000/login
4. Click en el botón **"Continuar con Google"**
5. Debería aparecer la pantalla de login de Google

---

## 🚨 Problemas Comunes

### Error: "redirect_uri_mismatch"
✅ **Solución:** Verifica que la URI de redirección en Google Cloud sea EXACTAMENTE:
```
http://localhost:3000/api/auth/callback/google
```

### Error: "Access blocked: This app's request is invalid"
✅ **Solución:** 
1. Verifica que configuraste la "Pantalla de consentimiento"
2. Agrega tu email en "Usuarios de prueba"

### Error: "App is not verified"
✅ **Solución:** Es normal en desarrollo. Click en "Avanzado" → "Ir a [tu app] (no seguro)"

---

## 📝 Resumen

Una vez que tengas tus credenciales:

```env
# Tu .env.local debería tener:
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu-client-id-aqui.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=GOCSPX-tu-secret-aqui
```

¡Y listo! El login con Google funcionará. 🎉

---

## 🔗 Enlaces Útiles

- **Google Cloud Console:** https://console.cloud.google.com
- **Documentación NextAuth:** https://next-auth.js.org/providers/google
- **Gestionar tus apps OAuth:** https://myaccount.google.com/permissions
