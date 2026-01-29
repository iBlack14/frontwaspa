# 💬 Chat Input Completo - Texto + Imágenes

## 🎯 Componente Todo-en-Uno

**ChatInput** es un componente completo que combina:
- ✅ Input de texto para mensajes
- ✅ Detección de pegado de imágenes (Ctrl+V)
- ✅ Botón para adjuntar archivos
- ✅ Auto-resize del textarea
- ✅ Preview de imágenes antes de enviar
- ✅ Caption para las imágenes

**¡Como WhatsApp Web en un solo componente!** 🎉

---

## 📸 Vista Previa

```
┌─────────────────────────────────────────┐
│  [📎]  [Escribe un mensaje...]  [😊] [➤]│
│        Ctrl+V para pegar imágenes       │
└─────────────────────────────────────────┘
```

Cuando pegas una imagen (Ctrl+V):
```
┌─────────────────────────────────────────┐
│  Vista previa de imagen            [✖]  │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │      [🖼️ IMAGEN AQUÍ]            │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ Agrega un mensaje...              │  │
│  └───────────────────────────────────┘  │
│                   [Cancelar] [Enviar ➤] │
└─────────────────────────────────────────┘
```

---

## 🚀 Uso Rápido

```tsx
import { ChatInput } from '@/components/chat/ChatInput';

<ChatInput
  onSendMessage={(text) => {
    console.log('Texto:', text);
    // Enviar mensaje de texto
  }}
  onSendImage={(file, caption) => {
    console.log('Imagen:', file, 'Caption:', caption);
    // Enviar imagen
  }}
  placeholder="Escribe un mensaje..."
  isSending={false}
/>
```

---

## 🎮 Funcionalidades

### 📝 Mensajes de Texto
- Escribe en el textarea
- Presiona **Enter** para enviar
- **Shift+Enter** para nueva línea
- Auto-resize hasta 4 líneas

### 🖼️ Imágenes
| Acción | Cómo |
|--------|------|
| Pegar imagen | `Ctrl + V` |
| Seleccionar archivo | Click en 📎 |
| Enviar imagen | `Ctrl + Enter` o botón "Enviar" |
| Cancelar | Click en ✖ |

### ✨ Extras
- 😊 Botón de emoji (puedes conectar picker)
- 📎 Botón de adjuntar archivos
- 🔄 Auto-resize del textarea
- ⌨️ Shortcuts de teclado

---

## 📋 Props

```typescript
interface ChatInputProps {
  /** Callback al enviar texto */
  onSendMessage: (text: string) => void;
  
  /** Callback al enviar imagen */
  onSendImage: (file: File, caption?: string) => void;
  
  /** Placeholder del input */
  placeholder?: string;
  
  /** Estado de envío */
  isSending?: boolean;
}
```

---

## 🎯 Ejemplo Completo

```tsx
import { useState } from 'react';
import { ChatInput } from '@/components/chat/ChatInput';

export default function MyChat() {
  const [isSending, setIsSending] = useState(false);

  const handleSendText = async (text: string) => {
    setIsSending(true);
    try {
      await fetch('/api/whatsapp/send-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendImage = async (file: File, caption?: string) => {
    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      if (caption) formData.append('caption', caption);

      await fetch('/api/whatsapp/send-image', {
        method: 'POST',
        body: formData,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Mensajes aquí */}
      <div className="flex-1 overflow-auto">
        {/* ... */}
      </div>

      {/* Input */}
      <ChatInput
        onSendMessage={handleSendText}
        onSendImage={handleSendImage}
        isSending={isSending}
      />
    </div>
  );
}
```

---

## ⌨️ Atajos de Teclado

| Atajo | Acción | Contexto |
|-------|--------|----------|
| `Enter` | Enviar mensaje | Textarea de texto |
| `Shift + Enter` | Nueva línea | Textarea de texto |
| `Ctrl + V` | Pegar imagen | Cualquier parte |
| `Ctrl + Enter` | Enviar imagen | Modal de preview |
| `Esc` | Cerrar preview | Modal de preview* |

*Puedes agregarlo modificando el componente

---

## 🎨 Personalización

### Cambiar Colores

```tsx
// El componente usa el design system
bg-brand-dark-900        // Fondo del input
bg-brand-primary-400     // Botón enviar
bg-brand-surface-medium  // Textarea
```

### Agregar Emojis

```tsx
// Instalar picker de emojis
npm install emoji-picker-react

// Importar
import EmojiPicker from 'emoji-picker-react';

// Agregar estado
const [showEmojiPicker, setShowEmojiPicker] = useState(false);

// Modificar el botón de emoji
<button onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
  <FaceSmileIcon />
</button>

{showEmojiPicker && (
  <EmojiPicker onEmojiClick={(emoji) => {
    setMessage(prev => prev + emoji.emoji);
  }} />
)}
```

### Limitar Tamaño de Imagen

```tsx
const handleSendImage = (file: File, caption?: string) => {
  // Validar tamaño
  if (file.size > 10 * 1024 * 1024) {
    toast.error('Imagen muy grande (máx 10MB)');
    return;
  }

  // Continuar...
  onSendImage(file, caption);
};
```

---

## 🔧 Características Técnicas

### Auto-resize del Textarea
- Se ajusta automáticamente según el contenido
- Máximo 4 líneas (max-h-32)
- Scroll automático si excede

### Detección de Pegado
- Escucha evento `paste` global
- Detecta solo tipos `image/*`
- Crea preview automáticamente con FileReader

### Estados
- `message`: Texto actual
- `pastedImage`: Archivo de imagen
- `imagePreview`: URL del preview
- `imageCaption`: Caption de la imagen

---

## 📦 Archivos del Feature

```
frontwaspa/
├── components/
│   └── chat/
│       ├── ChatInput.tsx              ← Componente principal ⭐
│       └── ImagePasteHandler.tsx      ← Componente legacy
├── examples/
│   └── ChatWithImagePaste.tsx         ← Ejemplo completo
└── pages/
    └── api/
        └── whatsapp/
            └── send-image.ts          ← API endpoint
```

---

## 🆚 Diferencia con ImagePasteHandler

| Feature | ChatInput | ImagePasteHandler |
|---------|-----------|-------------------|
| Input de texto | ✅ Sí | ❌ No |
| Pegar imágenes | ✅ Sí | ✅ Sí |
| Adjuntar archivos | ✅ Sí | ❌ No |
| Emoji button | ✅ Sí | ❌ No |
| Todo-en-uno | ✅ Sí | ❌ Solo imágenes |

**Recomendación:** Usa `ChatInput` para tu chat principal. Es más completo.

---

## 🐛 Troubleshooting

### El textarea no se auto-redimensiona
```tsx
// Verifica que tengas el ref correcto
const textareaRef = useRef<HTMLTextAreaElement>(null);

// Y que esté en el onChange
textareaRef.current.style.height = 'auto';
textareaRef.current.style.height = `${scrollHeight}px`;
```

### No detecta el pegado
```tsx
// Asegúrate de que el listener esté en document
useEffect(() => {
  const handlePaste = (e: ClipboardEvent) => { /*...*/ };
  document.addEventListener('paste', handlePaste);
  return () => document.removeEventListener('paste', handlePaste);
}, []);
```

### El botón de enviar no se habilita
```tsx
// Verifica la condición
disabled={!message.trim() || isSending}
```

---

## 🚀 Próximas Mejoras

- [ ] Soporte para audio/video
- [ ] Drag & drop de archivos
- [ ] Picker de emojis integrado
- [ ] Mensajes de voz
- [ ] Indicador de "escribiendo..."
- [ ] Múltiples archivos a la vez

---

## ✅ Checklist de Implementación

- [x] Componente ChatInput creado
- [x] Detección de pegado funcionando
- [x] Preview de imágenes
- [x] Caption para imágenes
- [x] Auto-resize del textarea
- [x] Botón de adjuntar archivos
- [x] API endpoint para imágenes
- [x] Ejemplo completo documentado
- [ ] Implementar en tu página de chat
- [ ] Conectar con el backend real

---

**¡Listo para usar! 🎉**

Tienes un componente completo de chat con **texto + imágenes** en un solo lugar.
