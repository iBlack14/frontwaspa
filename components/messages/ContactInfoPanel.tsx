import { useState, useEffect } from 'react';
import { Chat, Message } from '../../pages/messages/index';
import {
    XMarkIcon,
    PhoneIcon,
    EnvelopeIcon,
    LinkIcon,
    PhotoIcon,
    VideoCameraIcon,
    DocumentIcon,
    MusicalNoteIcon,
    NoSymbolIcon,
    TrashIcon,
    BellIcon,
    StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

interface ContactInfoPanelProps {
    chat: Chat;
    messages: Message[];
    isOpen: boolean;
    onClose: () => void;
}

export default function ContactInfoPanel({ chat, messages, isOpen, onClose }: ContactInfoPanelProps) {
    const [activeTab, setActiveTab] = useState<'media' | 'docs' | 'links'>('media');

    // Calcular estadísticas
    const stats = {
        totalMessages: messages.length,
        sentMessages: messages.filter(m => m.from_me).length,
        receivedMessages: messages.filter(m => !m.from_me).length,
        images: messages.filter(m => m.message_type === 'image').length,
        videos: messages.filter(m => m.message_type === 'video').length,
        audios: messages.filter(m => m.message_type === 'audio' || m.message_type === 'voice').length,
        documents: messages.filter(m => m.message_type === 'document').length,
    };

    // Obtener media para galería
    const mediaMessages = messages.filter(m =>
        (m.message_type === 'image' || m.message_type === 'video') && m.media_url
    );

    const documentMessages = messages.filter(m =>
        m.message_type === 'document' && m.media_url
    );

    // Extraer el número de teléfono del chat_id
    const phoneNumber = chat.chat_id.split('@')[0];

    // Formatear fecha
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Primer mensaje (fecha de inicio del chat)
    const firstMessage = messages.length > 0
        ? messages.reduce((min, m) => new Date(m.timestamp) < new Date(min.timestamp) ? m : min)
        : null;

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Panel */}
            <div className={`fixed right-0 top-0 h-full w-[380px] bg-white dark:bg-[#111b21] shadow-2xl z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-white font-semibold text-lg">Información del contacto</h3>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="h-[calc(100%-64px)] overflow-y-auto custom-scrollbar">
                    {/* Profile Section */}
                    <div className="bg-gradient-to-b from-indigo-500/10 to-transparent px-6 py-8 text-center">
                        <div className="relative inline-block">
                            {chat.profile_pic_url ? (
                                <img
                                    src={chat.profile_pic_url}
                                    alt={chat.chat_name || 'Contact'}
                                    className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-xl"
                                />
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-5xl border-4 border-white dark:border-slate-700 shadow-xl">
                                    {chat.chat_name?.[0]?.toUpperCase() || '?'}
                                </div>
                            )}
                            <span className="absolute bottom-2 right-2 w-5 h-5 bg-emerald-400 border-3 border-white dark:border-slate-800 rounded-full shadow-lg"></span>
                        </div>

                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-4">
                            {chat.chat_name || phoneNumber}
                        </h2>
                        <p className="text-indigo-600 dark:text-indigo-400 font-medium flex items-center justify-center gap-2 mt-1">
                            <PhoneIcon className="w-4 h-4" />
                            +{phoneNumber}
                        </p>
                        <span className="inline-block mt-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-full">
                            ● En línea
                        </span>
                    </div>

                    {/* Quick Actions */}
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex justify-center gap-3">
                            <button className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition group">
                                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 transition">
                                    <PhoneIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <span className="text-xs text-slate-600 dark:text-slate-400">Llamar</span>
                            </button>
                            <button className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition group">
                                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition">
                                    <VideoCameraIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <span className="text-xs text-slate-600 dark:text-slate-400">Video</span>
                            </button>
                            <button className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-pink-50 dark:hover:bg-pink-900/20 transition group">
                                <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center group-hover:bg-pink-200 dark:group-hover:bg-pink-800 transition">
                                    <StarIcon className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                                </div>
                                <span className="text-xs text-slate-600 dark:text-slate-400">Favorito</span>
                            </button>
                            <button className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 transition group">
                                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center group-hover:bg-amber-200 dark:group-hover:bg-amber-800 transition">
                                    <BellIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <span className="text-xs text-slate-600 dark:text-slate-400">Silenciar</span>
                            </button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                        <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">ESTADÍSTICAS</h4>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/20 rounded-xl p-3 text-center">
                                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.totalMessages}</p>
                                <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70">Mensajes</p>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 rounded-xl p-3 text-center">
                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.sentMessages}</p>
                                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Enviados</p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 rounded-xl p-3 text-center">
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.receivedMessages}</p>
                                <p className="text-xs text-purple-600/70 dark:text-purple-400/70">Recibidos</p>
                            </div>
                        </div>

                        {/* Media Stats */}
                        <div className="flex items-center justify-between mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                                <PhotoIcon className="w-4 h-4" />
                                <span className="text-sm">{stats.images}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                                <VideoCameraIcon className="w-4 h-4" />
                                <span className="text-sm">{stats.videos}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                                <MusicalNoteIcon className="w-4 h-4" />
                                <span className="text-sm">{stats.audios}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                                <DocumentIcon className="w-4 h-4" />
                                <span className="text-sm">{stats.documents}</span>
                            </div>
                        </div>
                    </div>

                    {/* Chat Info */}
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                        <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">INFORMACIÓN</h4>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                    <EnvelopeIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Tipo de chat</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{chat.chat_type}</p>
                                </div>
                            </div>
                            {firstMessage && (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Chat iniciado</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(firstMessage.timestamp)}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Media Gallery Tabs */}
                    <div className="px-6 py-4">
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setActiveTab('media')}
                                className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition ${activeTab === 'media' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                📸 Fotos y Videos
                            </button>
                            <button
                                onClick={() => setActiveTab('docs')}
                                className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition ${activeTab === 'docs' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            >
                                📄 Documentos
                            </button>
                        </div>

                        {/* Media Grid */}
                        {activeTab === 'media' && (
                            <div className="grid grid-cols-3 gap-2">
                                {mediaMessages.length > 0 ? (
                                    mediaMessages.slice(0, 9).map((msg, index) => (
                                        <div key={msg.id} className="aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 group relative cursor-pointer">
                                            {msg.message_type === 'image' ? (
                                                <img
                                                    src={msg.media_url}
                                                    alt=""
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-700">
                                                    <VideoCameraIcon className="w-8 h-8 text-slate-400" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                                <span className="opacity-0 group-hover:opacity-100 text-white text-xs">Ver</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-3 text-center py-8 text-slate-400">
                                        <PhotoIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No hay fotos o videos</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'docs' && (
                            <div className="space-y-2">
                                {documentMessages.length > 0 ? (
                                    documentMessages.slice(0, 5).map((msg) => (
                                        <a
                                            key={msg.id}
                                            href={msg.media_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                                                <DocumentIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                                                    {(msg.metadata as any)?.fileName || 'Documento'}
                                                </p>
                                                <p className="text-xs text-slate-400">{formatDate(msg.timestamp)}</p>
                                            </div>
                                        </a>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-slate-400">
                                        <DocumentIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No hay documentos</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Danger Zone */}
                    <div className="px-6 py-4 mt-4">
                        <div className="space-y-2">
                            <button className="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition">
                                <NoSymbolIcon className="w-5 h-5" />
                                <span className="text-sm font-medium">Bloquear contacto</span>
                            </button>
                            <button className="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition">
                                <TrashIcon className="w-5 h-5" />
                                <span className="text-sm font-medium">Eliminar chat</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
