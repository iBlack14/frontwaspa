# 📱 WazilRest - WhatsApp Business API Platform

Plataforma completa de gestión de WhatsApp Business con sistema de automatización, envíos masivos y control en tiempo real.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.2.3-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## 🚀 Características Principales

### 🔐 Autenticación y Gestión de Usuarios
- ✅ Autenticación con Google OAuth (NextAuth)
- ✅ Sistema de planes y suscripciones
- ✅ API Keys por usuario
- ✅ Gestión de perfil de usuario

### 📲 Gestión de Instancias WhatsApp
- ✅ Crear múltiples instancias de WhatsApp
- ✅ Generación de QR para conexión
- ✅ Monitoreo de estado en tiempo real
- ✅ Desconexión y reconexión de instancias
- ✅ Visualización de perfil conectado (nombre, número, foto)

### 📨 Sistema de Envío Masivo (SPAM)
- ✅ **Envío masivo desde Excel** con columnas personalizables
- ✅ **Progreso en tiempo real** con estadísticas detalladas
- ✅ **Botón STOP** para detener envíos en cualquier momento (< 500ms)
- ✅ Soporte para imágenes (URL o archivo subido)
- ✅ Configuración de tiempo de espera entre mensajes
- ✅ Reportes de éxito/error por contacto

### 📊 Dashboard y Analíticas
- ✅ Gráficos de mensajes enviados/recibidos
- ✅ Historial de actividad
- ✅ Estadísticas por instancia
- ✅ Lazy loading de componentes para mejor rendimiento

### 🛠️ Plantillas de Automatización
- ✅ SPAM WhatsApp (disponible)
- 🔜 Auto-respuestas
- 🔜 Envíos programados
- 🔜 Recordatorios automáticos

---

## 🏗️ Stack Tecnológico

### Frontend
- **Framework:** Next.js 15.2.3 (App Router + Turbo Mode)
- **Lenguaje:** TypeScript
- **UI:** TailwindCSS 4.0
- **Gráficos:** Chart.js + react-chartjs-2
- **Autenticación:** NextAuth 4.24.11
- **HTTP Client:** Axios
- **Notificaciones:** Sonner

### Backend WhatsApp
- **Framework:** Express 5.1.0
- **WhatsApp Library:** @whiskeysockets/baileys 6.17.16
- **Lenguaje:** TypeScript
- **QR Generation:** qrcode

### Base de Datos
- **Provider:** Supabase (PostgreSQL)
- **ORM:** @supabase/supabase-js

### Automatización (Opcional)
- **Workflow Engine:** N8N

---

## 📋 Requisitos Previos

- **Node.js:** >= 18.0.0
- **npm:** >= 9.0.0
- **Cuenta de Google Cloud:** Para OAuth
- **Cuenta de Supabase:** Para base de datos
- **Servidor Linux/VPS:** Para despliegue en producción

---

## ⚙️ Instalación

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd API-WATSAP-main
```

### 2. Instalar Dependencias

#### Frontend (Raíz del proyecto)
```bash
npm install
```

#### Backend WhatsApp
```bash
cd backend
npm install
cd ..
```

### 3. Configurar Variables de Entorno

#### Frontend: `.env.local`

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-random-string-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Backend WhatsApp
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000

# N8N (Opcional)
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n-url.com/webhook
```

#### Backend: `backend/.env`

```env
# Puerto
PORT=4000

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# N8N Webhook (Opcional)
N8N_UPDATE_WEBHOOK=https://your-n8n-url.com/webhook/update
```

### 4. Configurar Base de Datos (Supabase)

#### Crear Tablas

```sql
-- Tabla de perfiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  api_key TEXT UNIQUE,
  status_plan BOOLEAN DEFAULT false,
  plan_type TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de instancias
CREATE TABLE instances (
  id SERIAL PRIMARY KEY,
  document_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id),
  state TEXT DEFAULT 'Disconnected',
  qr TEXT,
  profile_name TEXT,
  phone_number TEXT,
  is_active BOOLEAN DEFAULT true,
  webhook_url TEXT,
  historycal_data JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de productos/planes
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2),
  fields JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Configurar Storage (para imágenes)

```sql
-- Crear bucket público
INSERT INTO storage.buckets (id, name, public)
VALUES ('public-files', 'public-files', true);

-- Políticas de acceso
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'public-files');

CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'public-files' AND auth.role() = 'authenticated');
```

### 5. Configurar Google OAuth

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear un nuevo proyecto o seleccionar existente
3. Habilitar "Google+ API"
4. Crear credenciales OAuth 2.0
5. Agregar URIs autorizadas:
   - `http://localhost:3000` (desarrollo)
   - `https://tu-dominio.com` (producción)
6. Agregar URIs de redirección:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://tu-dominio.com/api/auth/callback/google`

---

## 🚀 Ejecutar en Desarrollo

### Iniciar Frontend
```bash
npm run dev
```
El frontend estará disponible en: `http://localhost:3000`

### Iniciar Backend WhatsApp
```bash
cd backend
npm run dev
```
El backend estará disponible en: `http://localhost:4000`

---

## 📦 Despliegue en Producción

### Opción 1: Easypanel (Recomendado)

#### Requisitos:
- Servidor VPS con Easypanel instalado
- Dominio configurado

#### Pasos:

**1. Desplegar Frontend (Next.js)**

```yaml
# App Configuration
Name: wazilrest-frontend
Type: Next.js
Build Command: npm run build
Start Command: npm start
Port: 3000
Environment Variables:
  - NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url
  - SUPABASE_SERVICE_ROLE_KEY=your-key
  - NEXTAUTH_URL=https://your-domain.com
  - NEXTAUTH_SECRET=your-secret
  - GOOGLE_CLIENT_ID=your-client-id
  - GOOGLE_CLIENT_SECRET=your-client-secret
  - NEXT_PUBLIC_BACKEND_URL=https://backend.your-domain.com
```

**2. Desplegar Backend WhatsApp**

```yaml
# App Configuration
Name: wazilrest-backend
Type: Node.js
Build Command: npm install
Start Command: npm start
Port: 4000
Environment Variables:
  - PORT=4000
  - SUPABASE_URL=https://your-supabase-url
  - SUPABASE_SERVICE_KEY=your-key
  - N8N_UPDATE_WEBHOOK=https://your-n8n-url/webhook
```

**3. Configurar Dominios**
- Frontend: `wazilrest.com`
- Backend: `api.wazilrest.com`

**4. Habilitar SSL/HTTPS**
Easypanel gestiona automáticamente los certificados SSL con Let's Encrypt.

### Opción 2: Vercel + Railway

#### Frontend en Vercel
```bash
npm install -g vercel
vercel login
vercel --prod
```

#### Backend en Railway
1. Conectar repositorio
2. Configurar variables de entorno
3. Deploy automático

### Opción 3: Docker (Manual)

#### Dockerfile Frontend
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### Dockerfile Backend
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/ .

EXPOSE 4000

CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    env_file:
      - .env.production
    
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    ports:
      - "4000:4000"
    env_file:
      - backend/.env.production
    volumes:
      - ./backend/sessions:/app/sessions
```

---

## 📁 Estructura del Proyecto

```
API-WATSAP-main/
├── backend/                      # Backend WhatsApp (Express + Baileys)
│   ├── src/
│   │   ├── index.ts             # Servidor principal
│   │   ├── whatsapp.ts          # Lógica de WhatsApp
│   │   └── routes/              # Endpoints API
│   ├── sessions/                # Sesiones de WhatsApp (gitignored)
│   ├── package.json
│   └── .env
│
├── pages/                        # Pages Router (Next.js)
│   ├── api/                     # API Routes
│   │   ├── auth/                # NextAuth
│   │   ├── instances/           # CRUD instancias
│   │   │   ├── qr.js           # Generar QR
│   │   │   └── profile/        # Obtener perfil
│   │   ├── templates/           # Plantillas
│   │   │   ├── spam-whatsapp.js    # Envío masivo
│   │   │   └── spam-control.js     # Control de envíos
│   │   └── user/                # Gestión de usuarios
│   ├── components/              # Componentes React
│   │   └── dashboard/          # Layout principal
│   ├── home/                    # Dashboard
│   ├── instances/               # Gestión de instancias
│   ├── profile/                 # Perfil de usuario
│   └── templates/               # Plantillas de automatización
│       ├── index.tsx           # Lista de plantillas
│       └── spam-whatsapp.tsx   # Envío masivo
│
├── src/                         # Código fuente adicional
│   ├── lib/
│   │   ├── supabase-admin.ts   # Cliente Supabase
│   │   └── spam-control.js     # Sistema de control de envíos
│   ├── app/                     # App Router (opcional)
│   └── types/                   # TypeScript types
│
├── public/                      # Archivos estáticos
│   └── logo/
│
├── middleware.js                # Middleware de autenticación
├── next.config.ts               # Configuración Next.js
├── tailwind.config.ts           # Configuración TailwindCSS
├── tsconfig.json                # Configuración TypeScript
├── .gitignore
├── package.json
└── README.md
```

---

## 🔌 API Endpoints

### Frontend API Routes

#### Autenticación
- `GET /api/auth/signin` - Página de inicio de sesión
- `GET /api/auth/callback/google` - Callback de Google OAuth

#### Usuarios
- `GET /api/user/get` - Obtener perfil del usuario
- `PUT /api/user/update` - Actualizar perfil (username, api_key)

#### Instancias
- `GET /api/instances` - Listar instancias del usuario
- `POST /api/instances` - Crear nueva instancia
- `DELETE /api/instances?documentId=xxx` - Eliminar instancia
- `POST /api/instances/qr` - Generar QR para conexión
- `GET /api/instances/profile/:documentId` - Obtener perfil de instancia conectada

#### Plantillas
- `POST /api/templates/spam-whatsapp` - Iniciar envío masivo
- `GET /api/templates/spam-control?spamId=xxx` - Obtener estado de envío
- `POST /api/templates/spam-control` - Detener envío
  ```json
  {
    "action": "stop",
    "spamId": "spam_xxx_123456"
  }
  ```

### Backend WhatsApp API

#### Sesiones
- `POST /api/create-session` - Crear sesión de WhatsApp
  ```json
  {
    "clientId": "instance-uuid"
  }
  ```

- `GET /api/sessions` - Listar sesiones activas

- `GET /api/qr/:clientId` - Obtener QR de sesión

- `DELETE /api/disconnect/:clientId` - Desconectar sesión

#### Mensajes
- `POST /api/send-message/:clientId` - Enviar mensaje de texto
  ```json
  {
    "number": "573123456789",
    "message": "Hola desde WazilRest"
  }
  ```

- `POST /api/send-image/:clientId` - Enviar imagen con mensaje
  ```json
  {
    "number": "573123456789",
    "file": "https://example.com/image.png",
    "message": "Mira esta imagen"
  }
  ```

#### Perfil
- `GET /api/profile/:documentId` - Obtener datos de perfil conectado
  ```json
  {
    "name": "Juan Pérez",
    "number": "573123456789",
    "profilePicUrl": "https://..."
  }
  ```

---

## 🔧 Configuraciones Importantes

### Next.js (next.config.ts)

```typescript
const nextConfig = {
  reactStrictMode: true,
  
  // Optimización de compilación
  experimental: {
    optimizePackageImports: ['@heroicons/react', 'chart.js'],
  },
  
  // Excluir carpetas del file watcher (CRÍTICO para rendimiento)
  webpack: (config) => {
    config.watchOptions = {
      ignored: [
        '**/node_modules/**',
        '**/backend/sessions/**', // 8,900+ archivos
        '**/.next/**',
      ],
    };
    return config;
  },
  
  // Dominios permitidos para imágenes
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
};
```

### Middleware (middleware.js)

Protege rutas que requieren autenticación:
```javascript
export const config = {
  matcher: [
    '/home/:path*',
    '/instances/:path*',
    '/templates/:path*',
    '/profile/:path*',
  ],
};
```

---

## 🐛 Troubleshooting

### Problema: "Module not found: @/lib/spam-control"
**Solución:** El archivo debe estar en `src/lib/spam-control.js` porque el alias `@/` apunta a `./src/`

### Problema: Compilación lenta
**Solución:** 
1. Verificar que `backend/sessions/` esté en `.gitignore`
2. Limpiar carpeta: `Remove-Item -Recurse -Force backend\sessions\*`
3. Configuración webpack en `next.config.ts` debe excluir la carpeta

### Problema: QR no se genera
**Soluciones:**
1. Verificar que el backend esté corriendo en el puerto 4000
2. Verificar variable `NEXT_PUBLIC_BACKEND_URL`
3. Revisar logs del backend: `cd backend && npm run dev`

### Problema: Botón STOP no detiene envíos
**Solución:** Asegurarse de que:
1. `processSpamInBackground()` se ejecuta SIN `await`
2. El endpoint retorna inmediatamente con el `spamId`
3. La verificación `shouldContinue()` está dentro del loop

### Problema: Imágenes no se suben
**Solución:**
1. Verificar que el bucket `public-files` existe en Supabase
2. Verificar políticas de acceso en Storage
3. Verificar límite de tamaño (máx 5MB)

### Problema: "Session expired" en NextAuth
**Solución:**
1. Regenerar `NEXTAUTH_SECRET`: `openssl rand -base64 32`
2. Verificar que `NEXTAUTH_URL` coincida con el dominio actual
3. Limpiar cookies del navegador

---

## 📊 Optimizaciones de Rendimiento

### 1. Lazy Loading
```typescript
const LazyChart = lazy(() => import('./ChartComponent.tsx'));
```

### 2. Exclusión de File Watcher
Ver configuración de webpack en `next.config.ts`

### 3. Imágenes Optimizadas
```typescript
import Image from 'next/image';

<Image 
  src={profilePicUrl} 
  width={32} 
  height={32} 
  alt="Profile"
/>
```

### 4. API Routes con Caché
```typescript
export const config = {
  api: {
    externalResolver: true,
  },
};
```

---

## 🔒 Seguridad

### Variables de Entorno
- ❌ NUNCA commitear archivos `.env`
- ✅ Usar `.env.local` para desarrollo
- ✅ Configurar variables en el panel de hosting para producción

### API Keys
- ✅ Generar API keys únicas por usuario
- ✅ Validar API key en cada request del backend WhatsApp
- ✅ Rotar keys periódicamente

### Autenticación
- ✅ NextAuth con Google OAuth
- ✅ Verificar sesión en middleware
- ✅ CSRF protection habilitado

### Rate Limiting (Recomendado)
```bash
npm install express-rate-limit
```

---

## 📝 Scripts Disponibles

### Frontend
```bash
npm run dev          # Desarrollo (Turbo mode)
npm run build        # Build para producción
npm start            # Iniciar en producción
npm run lint         # Linting
```

### Backend
```bash
cd backend
npm run dev          # Desarrollo con nodemon
npm start            # Iniciar en producción
npm run build        # Compilar TypeScript
```

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add: nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

---

## 👥 Autores

- **Equipo WazilRest** - *Desarrollo inicial*

---

## 🙏 Agradecimientos

- [Baileys](https://github.com/WhiskeySockets/Baileys) - WhatsApp Web API
- [Next.js](https://nextjs.org/) - React Framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS

---

## 📞 Soporte

Para soporte, envía un email a soporte@wazilrest.com o abre un issue en GitHub.

---

## 🗺️ Roadmap

- [x] Sistema de autenticación con Google OAuth
- [x] Gestión de instancias WhatsApp
- [x] Envío masivo con control STOP
- [x] Dashboard con analíticas
- [ ] Sistema de auto-respuestas
- [ ] Envíos programados
- [ ] Integración con CRM
- [ ] API pública con documentación Swagger
- [ ] Sistema de webhooks
- [ ] Aplicación móvil

---

**¡Gracias por usar WazilRest! 🚀**
