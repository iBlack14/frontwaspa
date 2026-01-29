/**
 * IMAGE PASTE HANDLER
 * ====================================
 * Componente para manejar el pegado de imágenes desde el portapapeles.
 * Permite pegar imágenes con Ctrl+V y mostrar preview antes de enviar.
 */

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/Button';

interface ImagePasteHandlerProps {
    /** Callback cuando se selecciona una imagen para enviar */
    onImageSend: (file: File, caption?: string) => void;
    /** Callback cuando se cancela la preview */
    onCancel?: () => void;
    /** Texto placeholder para el caption */
    placeholderText?: string;
}

/**
 * Hook personalizado para detectar pegado de imágenes
 */
function useImagePaste(onImagePaste: (file: File) => void) {
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            // Buscar si hay una imagen en el portapapeles
            for (let i = 0; i < items.length; i++) {
                const item = items[i];

                if (item.type.startsWith('image/')) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    if (file) {
                        onImagePaste(file);
                    }
                    break;
                }
            }
        };

        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, [onImagePaste]);
}

/**
 * Componente principal para manejar pegado de imágenes
 */
export const ImagePasteHandler: React.FC<ImagePasteHandlerProps> = ({
    onImageSend,
    onCancel,
    placeholderText = 'Agregar un caption...',
}) => {
    const [pastedImage, setPastedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // ──────────────────────────────────────
    // 📋 DETECTAR PEGADO DE IMAGEN
    // ──────────────────────────────────────
    useImagePaste((file) => {
        setPastedImage(file);

        // Crear preview de la imagen
        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    });

    // ──────────────────────────────────────
    // 📤 ENVIAR IMAGEN
    // ──────────────────────────────────────
    const handleSend = () => {
        if (pastedImage) {
            onImageSend(pastedImage, caption);
            handleClose();
        }
    };

    // ──────────────────────────────────────
    // ❌ CANCELAR Y LIMPIAR
    // ──────────────────────────────────────
    const handleClose = () => {
        setPastedImage(null);
        setImagePreview(null);
        setCaption('');
        onCancel?.();
    };

    // Auto-focus en el textarea cuando se pega una imagen
    useEffect(() => {
        if (pastedImage && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [pastedImage]);

    // Si no hay imagen pegada, no renderizar nada
    if (!pastedImage || !imagePreview) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fadeIn">
            {/* ────────────────────────────────────────────────────────
       🖼️ PREVIEW DE LA IMAGEN
      ──────────────────────────────────────────────────────── */}
            <div className="bg-brand-dark-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl animate-slideUp">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">Imagen pegada del portapapeles</h2>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <XMarkIcon className="h-6 w-6 text-slate-300" />
                    </button>
                </div>

                {/* Imagen Preview */}
                <div className="relative w-full aspect-video bg-brand-dark-800 rounded-2xl overflow-hidden mb-4">
                    <Image
                        src={imagePreview}
                        alt="Pasted image preview"
                        fill
                        className="object-contain"
                        unoptimized
                    />
                </div>

                {/* Caption Input */}
                <div className="mb-4">
                    <textarea
                        ref={textareaRef}
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder={placeholderText}
                        className="w-full px-4 py-3 bg-brand-surface-medium text-white rounded-xl 
                       border border-white/20 focus:outline-none focus:ring-2 
                       focus:ring-brand-primary-400 resize-none placeholder-slate-400"
                        rows={3}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                                handleSend();
                            }
                        }}
                    />
                    <p className="text-xs text-slate-400 mt-2">
                        Presiona <kbd className="px-2 py-1 bg-white/10 rounded">Ctrl</kbd> +
                        <kbd className="px-2 py-1 bg-white/10 rounded ml-1">Enter</kbd> para enviar
                    </p>
                </div>

                {/* Acciones */}
                <div className="flex gap-3 justify-end">
                    <Button variant="ghost" onClick={handleClose}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSend}
                        rightIcon={<PaperAirplaneIcon className="h-5 w-5" />}
                    >
                        Enviar Imagen
                    </Button>
                </div>

                {/* Metadata de la imagen */}
                <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-slate-400">
                        📎 {pastedImage.name || 'clipboard-image.png'} •
                        {(pastedImage.size / 1024).toFixed(2)} KB •
                        {pastedImage.type}
                    </p>
                </div>
            </div>
        </div>
    );
};
