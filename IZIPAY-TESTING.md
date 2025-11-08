# 🧪 Guía de Pruebas - Izipay

## 📋 Antes de probar:

### 1. Verifica las variables de entorno

Asegúrate de tener el archivo `.env.local` con:

```bash
NEXT_PUBLIC_IZIPAY_PUBLIC_KEY=47575197:testpublickey_a3D9ovCVNYiJPdPry70gIGYhzU8aRcLa1iEX72P5CdixI
NEXT_PUBLIC_IZIPAY_ENDPOINT=https://api.micuentaweb.pe
NEXT_PUBLIC_IZIPAY_JS_URL=https://static.micuentaweb.pe/static/js/krypton-client/V4.0/stable/kr-payment-form.min.js
IZIPAY_USERNAME=47575197
IZIPAY_PASSWORD=testpassword_aUfHU1fnUEv66whwWsBctdGPoRzYRnpgYjVv0Wx6vobGR
IZIPAY_HMAC_KEY=ypEXi0Ia8SIpqW4SDQsqDvslpNuBB9M0EEg0h2OYcnUHH
```

### 2. Reinicia el servidor

```bash
npm run dev
```

### 3. Abre la consola del navegador (F12)

Esto te permitirá ver los logs y detectar errores.

---

## 💳 Tarjetas de Prueba:

### ✅ Pago EXITOSO
```
Número: 4970 1000 0000 0003
Vencimiento: 12/25
CVV: 123
Nombre: TEST USER
```

### ❌ Pago RECHAZADO
```
Número: 4970 1000 0000 0004
Vencimiento: 12/25
CVV: 123
```

### 💰 Fondos INSUFICIENTES
```
Número: 4970 1000 0000 0028
Vencimiento: 12/25
CVV: 123
```

---

## 🔍 Qué revisar en cada prueba:

### 1. **Abrir el modal**
- [ ] El modal se abre correctamente
- [ ] Se muestra el resumen del plan
- [ ] El formulario carga sin errores

### 2. **Llenar el formulario**
- [ ] Los campos aceptan los datos
- [ ] Los placeholders están en español
- [ ] El diseño se ve bien

### 3. **Hacer clic en "PAGAR"**
- [ ] Se muestra el mensaje "Procesando pago..."
- [ ] No se puede cerrar el modal durante el procesamiento

### 4. **Logs en la consola**

Deberías ver:
```
[Izipay] Creating payment token with: {...}
[Izipay] Token response: {...}
[Izipay] Form ready
[Izipay] Payment submitted: {...}
```

### 5. **Resultado esperado**

**Pago exitoso:**
- Alert: "¡Pago exitoso! Redirigiendo al dashboard..."
- Redirección a `/dashboard`

**Pago rechazado:**
- Mensaje de error en el modal
- Botón vuelve a estar disponible

---

## 🐛 Problemas comunes:

### El botón se queda cargando
**Causa**: No se está recibiendo respuesta de Izipay
**Solución**: 
1. Revisa los logs de la consola
2. Verifica que las credenciales sean correctas
3. Asegúrate de que el servidor esté corriendo

### Error al crear el token
**Causa**: Credenciales incorrectas o servidor de Izipay no disponible
**Solución**:
1. Verifica las variables de entorno
2. Revisa los logs del servidor (terminal)
3. Verifica que `axios` esté instalado: `npm list axios`

### El formulario no se muestra
**Causa**: Script de Izipay no se cargó
**Solución**:
1. Revisa la consola del navegador
2. Verifica que la URL del script sea correcta
3. Intenta recargar la página

---

## 📊 Checklist de prueba completa:

- [ ] Modal se abre correctamente
- [ ] Formulario carga sin errores
- [ ] Pago exitoso funciona (tarjeta 0003)
- [ ] Pago rechazado muestra error (tarjeta 0004)
- [ ] Redirección funciona después del pago
- [ ] Logs en consola son correctos
- [ ] No hay errores en la consola

---

## 🎯 Próximos pasos después de las pruebas:

1. **Configurar webhook** en Back Office de Izipay
2. **Actualizar la base de datos** cuando el pago sea exitoso
3. **Enviar email de confirmación** al usuario
4. **Cambiar a credenciales de producción** cuando estés listo
5. **Agregar página de éxito/error** personalizada

---

## 📞 Si algo no funciona:

1. Copia los logs de la consola del navegador
2. Copia los logs del terminal del servidor
3. Toma screenshots del error
4. Revisa este documento de nuevo

¡Buena suerte con las pruebas! 🚀
