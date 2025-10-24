# 📊 Implementación del Sistema de Tracking de Mensajes

## 🎯 Problema
El campo `historycal_data` está vacío porque no hay un sistema que registre y acumule los mensajes enviados/recibidos.

## ✅ Solución Temporal (YA IMPLEMENTADA)

### Generar Datos de Prueba
1. Ve a la página **Home**
2. Selecciona una instancia
3. Haz clic en el botón **"🧪 Generar Datos de Prueba"**
4. Las métricas se actualizarán automáticamente

Esto generará datos de prueba para los últimos 7 días con números aleatorios.

---

## 🚀 Solución Real - Sistema de Tracking de Mensajes

Para que las métricas funcionen con datos reales, necesitas implementar un sistema que registre cada mensaje enviado/recibido.

### Opción 1: Webhook desde el Backend de WhatsApp

Tu backend de WhatsApp debería llamar al endpoint `/api/instances/update-stats` cada vez que se envíe o reciba un mensaje.

**Ejemplo de llamada desde tu backend de WhatsApp:**

```javascript
// Cuando se envía un mensaje
await fetch('https://tu-frontend.com/api/instances/update-stats', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({
    documentId: 'c85c0c70-982a-4f02-8dfd-9935662ad8c3',
    message_sent: 1,      // Incrementar en 1
    api_message_sent: 0,  // Si es via API, poner 1
    message_received: 0
  })
});

// Cuando se recibe un mensaje
await fetch('https://tu-frontend.com/api/instances/update-stats', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({
    documentId: 'c85c0c70-982a-4f02-8dfd-9935662ad8c3',
    message_sent: 0,
    api_message_sent: 0,
    message_received: 1   // Incrementar en 1
  })
});
```

### Opción 2: Integración con Webhooks Existentes

Si ya tienes webhooks configurados para notificaciones de mensajes, modifícalos para que también actualicen las estadísticas.

**Archivo a modificar:** Tu backend de WhatsApp (donde procesas mensajes)

```javascript
// Ejemplo en Node.js/Express
app.post('/webhook/message-received', async (req, res) => {
  const { clientId, message } = req.body;
  
  // Tu lógica actual...
  
  // ✅ AGREGAR: Actualizar estadísticas
  await updateMessageStats(clientId, {
    message_received: 1
  });
  
  res.status(200).send('OK');
});

app.post('/webhook/message-sent', async (req, res) => {
  const { clientId, message, isApiMessage } = req.body;
  
  // Tu lógica actual...
  
  // ✅ AGREGAR: Actualizar estadísticas
  await updateMessageStats(clientId, {
    message_sent: 1,
    api_message_sent: isApiMessage ? 1 : 0
  });
  
  res.status(200).send('OK');
});

// Función helper
async function updateMessageStats(documentId, stats) {
  try {
    await fetch('https://tu-frontend.com/api/instances/update-stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_JWT_TOKEN'
      },
      body: JSON.stringify({
        documentId,
        ...stats
      })
    });
  } catch (error) {
    console.error('Error updating stats:', error);
  }
}
```

### Opción 3: Job Periódico (Batch Processing)

Si tienes una tabla que almacena todos los mensajes, puedes crear un job que se ejecute cada hora/día y agregue las estadísticas.

**Ejemplo con cron job:**

```javascript
// Archivo: jobs/update-daily-stats.js
import { supabaseAdmin } from '../lib/supabase-admin';

export async function updateDailyStats() {
  // 1. Obtener todas las instancias activas
  const { data: instances } = await supabaseAdmin
    .from('instances')
    .select('document_id, user_id')
    .eq('is_active', true);

  for (const instance of instances) {
    // 2. Contar mensajes de hoy desde tu tabla de mensajes
    const today = new Date().toISOString().split('T')[0];
    
    const sentCount = await countMessages({
      documentId: instance.document_id,
      date: today,
      type: 'sent'
    });
    
    const receivedCount = await countMessages({
      documentId: instance.document_id,
      date: today,
      type: 'received'
    });
    
    // 3. Actualizar historycal_data
    await fetch('http://localhost:3000/api/instances/update-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentId: instance.document_id,
        message_sent: sentCount,
        message_received: receivedCount
      })
    });
  }
}

// Ejecutar cada 24 horas
setInterval(updateDailyStats, 24 * 60 * 60 * 1000);
```

---

## 🔧 Endpoints Disponibles

### 1. `/api/instances/update-stats` (POST)
Actualiza las estadísticas de mensajes de una instancia.

**Body:**
```json
{
  "documentId": "c85c0c70-982a-4f02-8dfd-9935662ad8c3",
  "message_sent": 1,
  "api_message_sent": 0,
  "message_received": 0
}
```

### 2. `/api/instances/generate-test-data` (POST)
Genera datos de prueba para una instancia (SOLO PARA DESARROLLO).

**Body:**
```json
{
  "documentId": "c85c0c70-982a-4f02-8dfd-9935662ad8c3"
}
```

---

## 📊 Estructura de `historycal_data`

El campo `historycal_data` en la base de datos es un JSON con este formato:

```json
[
  {
    "date": "2025-10-23",
    "message_sent": 45,
    "api_message_sent": 30,
    "message_received": 89
  },
  {
    "date": "2025-10-22",
    "message_sent": 52,
    "api_message_sent": 25,
    "message_received": 102
  }
]
```

- Se mantienen los últimos **30 días** automáticamente
- Cada día tiene contadores separados
- Los datos se actualizan incrementalmente

---

## 🎨 Resultado Visual

Una vez implementado, verás:
- ✅ Tarjetas de métricas con números reales
- ✅ Gráfico histórico con datos de los últimos días
- ✅ Actualización automática cada 5 segundos (gracias a SWR en Instances)

---

## ⚠️ Importante

- **Nunca** uses el endpoint `generate-test-data` en producción
- Implementa **autenticación adecuada** en los webhooks
- Considera usar **Redis** para cachear contadores si tienes alto volumen
- Monitorea el tamaño del campo `historycal_data` (máximo 30 días)

---

## 📞 Próximos Pasos

1. ✅ **YA HECHO:** Generar datos de prueba para verificar el UI
2. 🔄 **PENDIENTE:** Implementar llamadas desde tu backend de WhatsApp
3. 🔄 **OPCIONAL:** Crear job periódico para agregación de datos
4. 🔄 **OPCIONAL:** Agregar más métricas (tasa de respuesta, tiempo promedio, etc.)
