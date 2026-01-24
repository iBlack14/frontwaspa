import React, { useState } from 'react';
import { Lock, Eye, CheckCheck } from 'lucide-react';

interface Message {
    id: string;
    message_id: string;
    message_type: string;
    message_text?: string;
    media_url?: string;
    from_me: boolean;
    timestamp: Date;
    is_read: boolean;
    is_view_once?: boolean;
    view_once_opened_at?: Date;
    sender_name?: string;
}

interface ViewOnceMessageProps {
    message: Message;
    onOpen?: (messageId: string) => Promise<void>;
}

/**
 * Componente para mostrar mensajes "Ver una vez" (View Once)
 * 
 * Características:
 * - Muestra el estado del mensaje (sin abrir / abierto)
 * - Botón para abrir solo si no ha sido visto
 * - Indicador visual de expiración
 * - Animaciones y transiciones suaves
 */
export const ViewOnceMessage: React.FC<ViewOnceMessageProps> = ({ message, onOpen }) => {
    const [isOpening, setIsOpening] = useState(false);
    const [isViewed, setIsViewed] = useState(!!message.view_once_opened_at);

    const handleOpen = async () => {
        if (isViewed || isOpening) return;

        setIsOpening(true);

        try {
            if (onOpen) {
                await onOpen(message.message_id);
                setIsViewed(true);
            }
        } catch (error) {
            console.error('Error opening view once message:', error);
        } finally {
            setIsOpening(false);
        }
    };

    const getMediaType = () => {
        if (message.message_type === 'view_once_image') return 'Imagen';
        if (message.message_type === 'view_once_video') return 'Video';
        return 'Archivo';
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(date));
    };

    return (
        <div className={`view-once-message ${message.from_me ? 'outgoing' : 'incoming'}`}>
            <div className={`view-once-bubble ${isViewed ? 'viewed' : 'unviewed'}`}>
                {/* Header con icono de candado */}
                <div className="view-once-header">
                    <Lock
                        size={18}
                        className={`lock-icon ${isViewed ? 'text-gray-400' : 'text-green-500'}`}
                    />
                    <span className="media-type">
                        {getMediaType()} (Ver una vez)
                    </span>
                </div>

                {/* Estado del mensaje */}
                {!isViewed ? (
                    <>
                        <div className="view-once-preview">
                            <div className="blur-overlay">
                                <Eye size={32} className="preview-icon" />
                                <p className="preview-text">Toca para ver</p>
                            </div>
                        </div>

                        <button
                            onClick={handleOpen}
                            disabled={isOpening}
                            className="open-button"
                        >
                            {isOpening ? (
                                <>
                                    <div className="spinner" />
                                    Abriendo...
                                </>
                            ) : (
                                <>
                                    <Eye size={16} />
                                    Ver ahora
                                </>
                            )}
                        </button>
                    </>
                ) : (
                    <div className="viewed-state">
                        <CheckCheck size={18} className="check-icon" />
                        <span className="viewed-text">
                            Visto el {formatDate(message.view_once_opened_at!)}
                        </span>
                    </div>
                )}

                {/* Caption si existe */}
                {message.message_text && (
                    <div className="caption">
                        {message.message_text}
                    </div>
                )}

                {/* Timestamp */}
                <div className="timestamp">
                    {formatDate(message.timestamp)}
                </div>
            </div>

            <style jsx>{`
        .view-once-message {
          display: flex;
          margin-bottom: 12px;
          max-width: 100%;
        }

        .view-once-message.incoming {
          justify-content: flex-start;
        }

        .view-once-message.outgoing {
          justify-content: flex-end;
        }

        .view-once-bubble {
          max-width: 320px;
          border-radius: 12px;
          padding: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .view-once-bubble.unviewed {
          background: linear-gradient(135deg, #1e3a5f 0%, #2d5a7b 100%);
          border: 2px solid #25d366;
        }

        .view-once-bubble.viewed {
          background: #424242;
          border: 2px solid #666;
        }

        .view-once-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .lock-icon {
          flex-shrink: 0;
        }

        .media-type {
          font-weight: 600;
          font-size: 14px;
          color: white;
        }

        .view-once-preview {
          position: relative;
          width: 100%;
          height: 180px;
          background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .blur-overlay {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          height: 100%;
          backdrop-filter: blur(20px);
          background: rgba(0, 0, 0, 0.3);
        }

        .preview-icon {
          color: white;
          opacity: 0.8;
        }

        .preview-text {
          color: white;
          font-size: 14px;
          font-weight: 500;
          margin: 0;
        }

        .open-button {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #2196f3, #1976d2);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
        }

        .open-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #1976d2, #1565c0);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
        }

        .open-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .open-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .viewed-state {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }

        .check-icon {
          color: #888;
          flex-shrink: 0;
        }

        .viewed-text {
          color: #aaa;
          font-size: 13px;
        }

        .caption {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 14px;
          line-height: 1.4;
        }

        .timestamp {
          margin-top: 8px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
          text-align: right;
        }
      `}</style>
        </div>
    );
};

/**
 * Componente de mensaje regular para comparación
 */
export const RegularMessage: React.FC<{ message: Message }> = ({ message }) => {
    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(date));
    };

    return (
        <div className={`regular-message ${message.from_me ? 'outgoing' : 'incoming'}`}>
            {message.message_type === 'image' && message.media_url && (
                <img src={message.media_url} alt="Imagen" className="message-image" />
            )}

            {message.message_text && (
                <div className="message-text">{message.message_text}</div>
            )}

            <div className="message-time">
                {formatDate(message.timestamp)}
                {message.from_me && (
                    <CheckCheck size={14} className={message.is_read ? 'read' : 'sent'} />
                )}
            </div>

            <style jsx>{`
        .regular-message {
          max-width: 320px;
          background: ${message.from_me ? '#dcf8c6' : 'white'};
          border-radius: 8px;
          padding: 8px 12px;
          margin-bottom: 8px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .message-image {
          width: 100%;
          border-radius: 4px;
          margin-bottom: 4px;
        }

        .message-text {
          font-size: 14px;
          line-height: 1.4;
          color: #303030;
          margin-bottom: 4px;
        }

        .message-time {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
          font-size: 11px;
          color: #667781;
        }

        .read {
          color: #53bdeb;
        }

        .sent {
          color: #667781;
        }
      `}</style>
        </div>
    );
};

/**
 * Ejemplo de uso en un componente de chat
 */
export const ChatExample = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            message_id: 'msg_1',
            message_type: 'image',
            media_url: 'https://example.com/sunset.jpg',
            from_me: false,
            timestamp: new Date('2026-01-24T17:25:00'),
            is_read: true,
            sender_name: 'Ana',
        },
        {
            id: '2',
            message_id: 'msg_2',
            message_type: 'view_once_image',
            from_me: false,
            timestamp: new Date('2026-01-24T17:28:00'),
            is_read: false,
            is_view_once: true,
            sender_name: 'Ana',
        },
        {
            id: '3',
            message_id: 'msg_3',
            message_type: 'view_once_video',
            message_text: 'Mira esto!',
            from_me: false,
            timestamp: new Date('2026-01-24T17:30:00'),
            is_read: false,
            is_view_once: true,
            view_once_opened_at: new Date('2026-01-24T17:30:15'),
            sender_name: 'Ana',
        },
    ]);

    const handleOpenViewOnce = async (messageId: string) => {
        // Simular llamada API
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Actualizar estado local
        setMessages(prev =>
            prev.map(msg =>
                msg.message_id === messageId
                    ? { ...msg, view_once_opened_at: new Date() }
                    : msg
            )
        );

        // En producción, hacer la llamada real:
        // await fetch(`/api/messages/${messageId}/mark-viewed`, { method: 'POST' });
    };

    return (
        <div className="chat-container">
            {messages.map(message => (
                message.is_view_once ? (
                    <ViewOnceMessage
                        key={message.id}
                        message={message}
                        onOpen={handleOpenViewOnce}
                    />
                ) : (
                    <RegularMessage key={message.id} message={message} />
                )
            ))}
        </div>
    );
};

export default ChatExample;
