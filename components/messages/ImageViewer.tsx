import { useState, useEffect } from 'react';
import { XMarkIcon, ArrowDownTrayIcon, MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon } from '@heroicons/react/24/outline';

interface ImageViewerProps {
  imageUrl: string;
  caption?: string;
  onClose: () => void;
}

export default function ImageViewer({ imageUrl, caption, onClose }: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Cerrar con tecla ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Prevenir scroll del body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `imagen_${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error descargando imagen:', error);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      {/* Header con controles */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Caption */}
          {caption && (
            <div className="flex-1 mr-4">
              <p className="text-white text-sm line-clamp-2">{caption}</p>
            </div>
          )}
          
          {/* Controles */}
          <div className="flex items-center gap-2">
            {/* Zoom Out */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomOut();
              }}
              className="p-2 text-white hover:bg-white/10 rounded-full transition"
              title="Alejar"
            >
              <MagnifyingGlassMinusIcon className="w-6 h-6" />
            </button>

            {/* Zoom In */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomIn();
              }}
              className="p-2 text-white hover:bg-white/10 rounded-full transition"
              title="Acercar"
            >
              <MagnifyingGlassPlusIcon className="w-6 h-6" />
            </button>

            {/* Descargar */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="p-2 text-white hover:bg-white/10 rounded-full transition"
              title="Descargar"
            >
              <ArrowDownTrayIcon className="w-6 h-6" />
            </button>

            {/* Cerrar */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-2 text-white hover:bg-white/10 rounded-full transition"
              title="Cerrar (ESC)"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Imagen */}
      <div 
        className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}
        
        <img
          src={imageUrl}
          alt="Vista previa"
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl transition-transform duration-200"
          style={{ 
            transform: `scale(${scale})`,
            cursor: scale > 1 ? 'move' : 'default'
          }}
          onLoad={() => setIsLoading(false)}
          draggable={false}
        />
      </div>

      {/* Footer con info */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-white/60 text-sm">
            Zoom: {Math.round(scale * 100)}% • Click fuera para cerrar • ESC para salir
          </p>
        </div>
      </div>

      {/* Animación de entrada */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
