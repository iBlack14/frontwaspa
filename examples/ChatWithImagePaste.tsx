/**
 * EJEMPLO COMPLETO: Chat con Input Integrado
 * ====================================
 * Ejemplo de uso del ChatInput (texto + imágenes pegadas)
 */

import React, { useState } from 'react';
import { ChatInput } from '@/components/chat/ChatInput';
import { Card } from '@/components/ui/Card';
import { toast } from 'sonner';

interface Message {
    id: string;
    type: 'text' | 'image';
    content?: string;
    imageUrl?: string;
    caption?: string;
    from_me: boolean;
    timestamp: Date;
}

export default function CompleteChatExample() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isSending, setIsSending] = useState(false);

    // ────────────────────────────────────────────────────────
    // 📤 ENVIAR MENSAJE DE TEXTO
    // ────────────────────────────────────────────────────────
    const handleSendMessage = async (text: string) => {
        setIsSending(true);

        try {
            // Simular envío al backend
            const response = await fetch('/api/whatsapp/send-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text }),
            });

            if (!response.ok) throw new Error('Error al enviar');

            const data = await response.json();

            // Agregar mensaje a la lista
            setMessages((prev) => [
                ...prev,
                {
                    id: data.messageId || Date.now().toString(),
                    type: 'text',
                    content: text,
                    from_me: true,
                    timestamp: new Date(),
                },
            ]);

            toast.success('Mensaje enviado');
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al enviar mensaje');
        } finally {
            setIsSending(false);
        }
    };

    // ────────────────────────────────────────────────────────
    // 🖼️ ENVIAR IMAGEN
    // ────────────────────────────────────────────────────────
    const handleSendImage = async (file: File, caption?: string) => {
        setIsSending(true);

        try {
            const formData = new FormData();
            formData.append('image', file);
            if (caption) formData.append('caption', caption);

            const response = await fetch('/api/whatsapp/send-image', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Error al enviar imagen');

            const data = await response.json();

            // Agregar imagen a la lista
            setMessages((prev) => [
                ...prev,
                {
                    id: data.messageId || Date.now().toString(),
                    type: 'image',
                    imageUrl: data.mediaUrl,
                    caption: caption,
                    from_me: true,
                    timestamp: new Date(),
                },
            ]);

            toast.success('Imagen enviada');
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al enviar imagen');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-dark-950 flex flex-col">
            {/* ────────────────────────────────────────────────────────
       📱 HEADER
      ──────────────────────────────────────────────────────── */}
            <div className="bg-brand-dark-900 border-b border-white/10 p-4">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-xl font-bold text-white">WhatsApp Manager</h1>
                    <p className="text-sm text-slate-400">Chat integrado con soporte de imágenes</p>
                </div>
            </div>

            {/* ────────────────────────────────────────────────────────
       💬 MENSAJES
      ──────────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-4xl mx-auto space-y-4">
                    {/* Info inicial */}
                    {messages.length === 0 && (
                        <Card variant="medium" padding="lg" className="text-center">
                            <p className="text-slate-400">
                                👋 ¡Bienvenido! Escribe un mensaje o pega una imagen (Ctrl+V)
                            </p>
                        </Card>
                    )}

                    {/* Lista de mensajes */}
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.from_me ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-md ${msg.from_me ? 'bg-brand-primary-600' : 'bg-brand-surface-medium'} 
                              rounded-2xl p-3 shadow-lg`}>

                                {/* Mensaje de texto */}
                                {msg.type === 'text' && (
                                    <p className="text-white whitespace-pre-wrap break-words">
                                        {msg.content}
                                    </p>
                                )}

                                {/* Mensaje con imagen */}
                                {msg.type === 'image' && msg.imageUrl && (
                                    <div>
                                        <img
                                            src={msg.imageUrl}
                                            alt="Message"
                                            className="rounded-lg w-full mb-2"
                                        />
                                        {msg.caption && (
                                            <p className="text-white text-sm">{msg.caption}</p>
                                        )}
                                    </div>
                                )}

                                {/* Timestamp */}
                                <p className="text-xs text-white/60 mt-1 text-right">
                                    {msg.timestamp.toLocaleTimeString('es-ES', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ────────────────────────────────────────────────────────
       ⌨️ INPUT DE CHAT (Texto + Imágenes)
      ──────────────────────────────────────────────────────── */}
            <ChatInput
                onSendMessage={handleSendMessage}
                onSendImage={handleSendImage}
                placeholder="Escribe un mensaje..."
                isSending={isSending}
            />
        </div>
    );
}
