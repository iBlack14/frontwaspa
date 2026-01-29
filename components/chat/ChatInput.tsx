/**
 * CHAT INPUT - Componente Completo de Input
 * ====================================
 * Input de texto + detección de imágenes pegadas
 * Similar a WhatsApp Web: escribe texto O pega imágenes
 */

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
    PaperAirplaneIcon,
    PaperClipIcon,
    FaceSmileIcon,
    XMarkIcon,
    PhotoIcon
} from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/Button';

interface ChatInputProps {
    /** Callback al enviar mensaje de texto */
    onSendMessage: (text: string) => void;
    /** Callback al enviar imagen */
    onSendImage: (file: File, caption?: string) => void;
    /** Placeholder del input */
    placeholder?: string;
    /** Está enviando */
    isSending?: boolean;
}

/**
 * Componente de input completo para chat con soporte de:
 * - Texto normal
 * - Pegado de imágenes (Ctrl+V)
 * - Selección de archivos
 */
export const ChatInput: React.FC<ChatInputProps> = ({
    onSendMessage,
    onSendImage,
    placeholder = 'Escribe un mensaje...',
    isSending = false,
}) => {
    // ────────────────────────────────────────────────────────
    // 🎯 ESTADO
    // ────────────────────────────────────────────────────────
    const [message, setMessage] = useState('');
    const [pastedImage, setPastedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageCaption, setImageCaption] = useState('');

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ────────────────────────────────────────────────────────
    // 📋 DETECTAR PEGADO DE IMAGEN
    // ────────────────────────────────────────────────────────
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            // Buscar imagen en el portapapeles
            for (let i = 0; i < items.length; i++) {
                const item = items[i];

                if (item.type.startsWith('image/')) {
                    e.preventDefault();
                    const file = item.getAsFile();

                    if (file) {
                        setPastedImage(file);

                        // Crear preview
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            setImagePreview(e.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                    }
                    break;
                }
            }
        };

        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, []);

    // ────────────────────────────────────────────────────────
    // 📤 ENVIAR MENSAJE DE TEXTO
    // ────────────────────────────────────────────────────────
    const handleSendText = () => {
        if (message.trim() && !isSending) {
            onSendMessage(message.trim());
            setMessage('');

            // Reset altura del textarea
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    // ────────────────────────────────────────────────────────
    // 🖼️ ENVIAR IMAGEN
    // ────────────────────────────────────────────────────────
    const handleSendImage = () => {
        if (pastedImage) {
            onSendImage(pastedImage, imageCaption || undefined);
            handleCloseImagePreview();
        }
    };

    // ────────────────────────────────────────────────────────
    // ❌ CERRAR PREVIEW DE IMAGEN
    // ────────────────────────────────────────────────────────
    const handleCloseImagePreview = () => {
        setPastedImage(null);
        setImagePreview(null);
        setImageCaption('');
    };

    // ────────────────────────────────────────────────────────
    // 📁 SELECCIONAR ARCHIVO
    // ────────────────────────────────────────────────────────
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setPastedImage(file);

            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // ────────────────────────────────────────────────────────
    // ⌨️ MANEJAR TECLAS
    // ────────────────────────────────────────────────────────
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendText();
        }
    };

    // ────────────────────────────────────────────────────────
    // 📏 AUTO-RESIZE TEXTAREA
    // ────────────────────────────────────────────────────────
    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);

        // Auto-resize
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    return (
        <>
            {/* ════════════════════════════════════════════════════════
       🖼️ MODAL DE PREVIEW DE IMAGEN (si hay imagen pegada)
      ════════════════════════════════════════════════════════ */}
            {pastedImage && imagePreview && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-brand-dark-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl animate-slideUp">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <PhotoIcon className="h-6 w-6 text-brand-primary-400" />
                                Vista previa de imagen
                            </h2>
                            <button
                                onClick={handleCloseImagePreview}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <XMarkIcon className="h-6 w-6 text-slate-300" />
                            </button>
                        </div>

                        {/* Preview */}
                        <div className="relative w-full aspect-video bg-brand-dark-800 rounded-2xl overflow-hidden mb-4">
                            <Image
                                src={imagePreview}
                                alt="Preview"
                                fill
                                className="object-contain"
                                unoptimized
                            />
                        </div>

                        {/* Caption */}
                        <div className="mb-4">
                            <textarea
                                value={imageCaption}
                                onChange={(e) => setImageCaption(e.target.value)}
                                placeholder="Agrega un mensaje..."
                                className="w-full px-4 py-3 bg-brand-surface-medium text-white rounded-xl 
                           border border-white/20 focus:outline-none focus:ring-2 
                           focus:ring-brand-primary-400 resize-none placeholder-slate-400"
                                rows={2}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.ctrlKey) {
                                        handleSendImage();
                                    }
                                }}
                            />
                            <p className="text-xs text-slate-400 mt-2">
                                <kbd className="px-2 py-1 bg-white/10 rounded">Ctrl</kbd> +
                                <kbd className="px-2 py-1 bg-white/10 rounded ml-1">Enter</kbd> para enviar
                            </p>
                        </div>

                        {/* Botones */}
                        <div className="flex gap-3 justify-end">
                            <Button variant="ghost" onClick={handleCloseImagePreview}>
                                Cancelar
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleSendImage}
                                isLoading={isSending}
                                rightIcon={<PaperAirplaneIcon className="h-5 w-5" />}
                            >
                                Enviar
                            </Button>
                        </div>

                        {/* Info */}
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <p className="text-xs text-slate-400">
                                📎 {pastedImage.name} • {(pastedImage.size / 1024).toFixed(2)} KB
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════
       💬 INPUT PRINCIPAL DE TEXTO
      ════════════════════════════════════════════════════════ */}
            <div className="bg-brand-dark-900 border-t border-white/10 p-4">
                <div className="max-w-4xl mx-auto flex items-end gap-3">
                    {/* Botón de adjuntar */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 hover:bg-brand-surface-light rounded-full transition-colors group"
                        title="Adjuntar archivo"
                    >
                        <PaperClipIcon className="h-6 w-6 text-slate-400 group-hover:text-brand-primary-400 transition-colors" />
                    </button>

                    {/* Input oculto para archivos */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {/* Textarea de mensaje */}
                    <div className="flex-1 relative">
                        <textarea
                            ref={textareaRef}
                            value={message}
                            onChange={handleTextChange}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            disabled={isSending}
                            className="w-full px-4 py-3 pr-12 bg-brand-surface-medium text-white 
                         rounded-2xl border border-white/20 
                         focus:outline-none focus:ring-2 focus:ring-brand-primary-400 
                         resize-none placeholder-slate-400 max-h-32 
                         disabled:opacity-50"
                            rows={1}
                            style={{ minHeight: '48px' }}
                        />

                        {/* Emoji button (posición absoluta dentro del textarea) */}
                        <button
                            className="absolute right-3 bottom-3 p-1 hover:bg-white/10 rounded-full transition-colors"
                            title="Emoji"
                        >
                            <FaceSmileIcon className="h-6 w-6 text-slate-400 hover:text-brand-primary-400" />
                        </button>
                    </div>

                    {/* Botón de enviar */}
                    <button
                        onClick={handleSendText}
                        disabled={!message.trim() || isSending}
                        className="p-3 bg-brand-primary-400 hover:bg-brand-primary-500 
                       disabled:bg-slate-700 disabled:cursor-not-allowed
                       rounded-full transition-all transform 
                       hover:scale-105 active:scale-95
                       disabled:scale-100"
                        title="Enviar mensaje"
                    >
                        <PaperAirplaneIcon className="h-6 w-6 text-white" />
                    </button>
                </div>

                {/* Hint de pegado */}
                <p className="text-center text-xs text-slate-500 mt-2">
                    Presiona <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-slate-400">Ctrl</kbd> +
                    <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-slate-400 ml-1">V</kbd> para pegar imágenes
                </p>
            </div>
        </>
    );
};
