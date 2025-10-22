# 📦 N8N Workflows - Importación Rápida

## 🚀 Cómo Importar los Workflows

### Método 1: Importar desde archivo (Recomendado)

1. **Abre N8N**: `https://blxk-n8n.1mrj9n.easypanel.host`
2. Click en **"Workflows"** (menú lateral izquierdo)
3. Click en **"Add workflow"** → **"Import from file"**
4. Selecciona uno de los archivos JSON de esta carpeta
5. Click en **"Import"**
6. **Importante**: Verifica que las credenciales de Supabase estén configuradas
7. Click en **"Save"**
8. Activa el workflow con el switch **"Active"**

### Método 2: Copiar y pegar JSON

1. Abre el archivo JSON en un editor de texto
2. Copia todo el contenido
3. En N8N, click en **"Add workflow"** → **"Import from URL or JSON"**
4. Pega el JSON
5. Click en **"Import"**
6. Configura credenciales y activa

---

## 📋 Lista de Workflows

### ✅ Workflow 1: Create WhatsApp Instance
- **Archivo**: Ya lo tienes creado manualmente
- **Path**: `/webhook/create-instance`
- **Método**: POST
- **Descripción**: Crea una nueva instancia de WhatsApp en Supabase

### ✅ Workflow 2: Update Instance State
- **Archivo**: `workflow-2-update-state.json`
- **Path**: `/webhook/update-instance`
- **Método**: PUT
- **Descripción**: Actualiza el estado de una instancia (QR, conexión, perfil)

### ✅ Workflow 3: Get QR Code
- **Archivo**: `workflow-3-get-qr.json`
- **Path**: `/webhook/get-qr`
- **Método**: POST
- **Descripción**: Obtiene el código QR de una instancia

### ✅ Workflow 4: Disconnect Instance
- **Archivo**: `workflow-4-disconnect.json`
- **Path**: `/webhook/disconnect-instance`
- **Método**: POST
- **Descripción**: Desconecta una instancia de WhatsApp

### ✅ Workflow 5: Update Webhook URL
- **Archivo**: `workflow-5-update-webhook.json`
- **Path**: `/webhook/update-webhook`
- **Método**: POST
- **Descripción**: Actualiza la URL del webhook de una instancia

---

## ⚙️ Configuración Necesaria

### Antes de importar, asegúrate de tener:

1. **Credenciales de Supabase configuradas en N8N**:
   - Name: `Supabase account`
   - Host: `blxk-supabase.1mrj9n.easypanel.host`
   - Service Role Secret: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q`

2. **Backend de WhatsApp corriendo** (lo configuraremos después):
   - URL: `http://localhost:4000`

---

## 🔄 Orden de Importación Recomendado

1. ✅ **Workflow 1**: Create Instance (ya lo tienes)
2. ⬜ **Workflow 2**: Update State
3. ⬜ **Workflow 3**: Get QR
4. ⬜ **Workflow 4**: Disconnect
5. ⬜ **Workflow 5**: Update Webhook

---

## 📝 Después de Importar

### 1. Verificar Credenciales
Cada workflow que use Supabase debe tener las credenciales configuradas:
- Abre el nodo de Supabase
- Verifica que diga "Supabase account"
- Si no, selecciona las credenciales correctas

### 2. Activar Workflows
- Cada workflow debe estar **Active** (switch verde)
- Verifica en la lista de workflows que todos estén activos

### 3. Copiar URLs de Webhooks
Abre cada workflow y copia la URL del webhook:

```
Workflow 1: https://blxk-n8n.1mrj9n.easypanel.host/webhook/create-instance
Workflow 2: https://blxk-n8n.1mrj9n.easypanel.host/webhook/update-instance
Workflow 3: https://blxk-n8n.1mrj9n.easypanel.host/webhook/get-qr
Workflow 4: https://blxk-n8n.1mrj9n.easypanel.host/webhook/disconnect-instance
Workflow 5: https://blxk-n8n.1mrj9n.easypanel.host/webhook/update-webhook
https://blxk-n8n.1mrj9n.easypanel.host/webhook/update-webhook
```

### 4. Actualizar .env.local
Agrega estas URLs a tu archivo `.env.local`:

```env
# N8N Webhooks
NEXT_PUBLIC_N8N_CREATE_INSTANCE=https://blxk-n8n.1mrj9n.easypanel.host/webhook/create-instance
NEXT_PUBLIC_N8N_UPDATE_INSTANCE=https://blxk-n8n.1mrj9n.easypanel.host/webhook/update-instance
NEXT_PUBLIC_N8N_GET_QR=https://blxk-n8n.1mrj9n.easypanel.host/webhook/get-qr
NEXT_PUBLIC_N8N_DISCONNECT=https://blxk-n8n.1mrj9n.easypanel.host/webhook/disconnect-instance
NEXT_PUBLIC_N8N_UPDATE_WEBHOOK=https://blxk-n8n.1mrj9n.easypanel.host/webhook/update-webhook
```

---

## 🧪 Probar los Workflows

### Probar con cURL (desde terminal):

**1. Create Instance:**
```bash
curl -X POST https://blxk-n8n.1mrj9n.easypanel.host/webhook/create-instance \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "test-123",
    "userId": "tu-user-id-de-supabase"
  }'
```

**2. Update State:**
```bash
curl -X PUT https://blxk-n8n.1mrj9n.easypanel.host/webhook/update-instance \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "test-123",
    "state": "Connected",
    "qr": null,
    "qr_loading": false
  }'
```

**3. Get QR:**
```bash
curl -X POST https://blxk-n8n.1mrj9n.easypanel.host/webhook/get-qr \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "test-123"
  }'
```

---

## ✅ Checklist de Verificación

- [ ] Credenciales de Supabase configuradas en N8N
- [ ] Workflow 1 activo (Create Instance)
- [ ] Workflow 2 importado y activo (Update State)
- [ ] Workflow 3 importado y activo (Get QR)
- [ ] Workflow 4 importado y activo (Disconnect)
- [ ] Workflow 5 importado y activo (Update Webhook)
- [ ] URLs de webhooks copiadas
- [ ] .env.local actualizado con las URLs
- [ ] Workflows probados con cURL

---

## 🆘 Troubleshooting

### Error: "Credential not found"
**Solución**: 
1. Ve a Settings → Credentials
2. Verifica que exista "Supabase account"
3. Si no existe, créala con los datos de arriba

### Error: "Table 'instances' not found"
**Solución**:
1. Ve a Supabase Studio
2. Verifica que la tabla `instances` exista
3. Si no, ejecuta el SQL de creación de tablas

### Workflow no responde
**Solución**:
1. Verifica que el workflow esté **Active**
2. Revisa los logs: Click en "Executions" en el workflow
3. Verifica la URL del webhook

### Error al conectar con Backend
**Solución**:
- El backend de WhatsApp aún no está configurado
- Los workflows funcionarán parcialmente hasta que configures el backend
- Por ahora, los datos se guardarán en Supabase correctamente

---

## 🎯 Próximo Paso

Una vez que todos los workflows estén activos, el siguiente paso es:

**Configurar el Backend de WhatsApp con Baileys**

Ver: `../BACKEND_WHATSAPP_SETUP.md` (lo crearemos después)

---

¡Listo! Ahora puedes importar todos los workflows en menos de 5 minutos 🚀
