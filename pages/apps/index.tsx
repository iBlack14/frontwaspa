import React, { useState } from 'react';
import Head from 'next/head';
import Sidebard from '../components/dashboard/index';
import { Toaster, toast } from 'sonner';
import {
    ChatBubbleLeftRightIcon,
    CameraIcon,
    PaperAirplaneIcon,
    CheckCircleIcon,
    XCircleIcon,
    Cog6ToothIcon,
    ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

// Interfaces
interface AppConfig {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    color: string;
    status: 'connected' | 'disconnected' | 'configuring';
    docsUrl: string;
}

// Mock data for initial UI
const APPS: AppConfig[] = [
    {
        id: 'whatsapp',
        name: 'WhatsApp Cloud API',
        description: 'Integra la API oficial de WhatsApp Business para mensajería escalable.',
        icon: ChatBubbleLeftRightIcon,
        color: 'emerald',
        status: 'connected',
        docsUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api',
    },
    {
        id: 'instagram',
        name: 'Instagram Graph API',
        description: 'Gestiona mensajes directos y comentarios de Instagram profesionalmente.',
        icon: CameraIcon,
        color: 'pink',
        status: 'disconnected',
        docsUrl: 'https://developers.facebook.com/docs/instagram-api',
    },
    {
        id: 'telegram',
        name: 'Telegram Bot API',
        description: 'Crea bots potentes para automatizar interacciones en Telegram.',
        icon: PaperAirplaneIcon,
        color: 'sky',
        status: 'disconnected',
        docsUrl: 'https://core.telegram.org/bots/api',
    },
];

function AppsContent() {
    const [selectedApp, setSelectedApp] = useState<AppConfig | null>(null);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

    const handleConfigure = (app: AppConfig) => {
        setSelectedApp(app);
        setIsConfigModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsConfigModalOpen(false);
        setSelectedApp(null);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-transparent p-8">
            <Head>
                <title>Apps & Integraciones | Connect BLXK</title>
            </Head>
            <Toaster richColors position="top-right" />

            <div className="max-w-7xl mx-auto animate-fadeIn">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Apps & Integraciones
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">
                        Conecta tus plataformas favoritas usando las APIs oficiales.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {APPS.map((app) => (
                        <div
                            key={app.id}
                            className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group"
                        >
                            <div className={`h-2 bg-${app.color}-500 w-full`}></div>
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-4 rounded-2xl bg-${app.color}-50 dark:bg-${app.color}-900/20 text-${app.color}-600 dark:text-${app.color}-400 group-hover:scale-110 transition-transform duration-300`}>
                                        <app.icon className="w-8 h-8" />
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${app.status === 'connected'
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                        }`}>
                                        {app.status === 'connected' ? (
                                            <>
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                Conectado
                                            </>
                                        ) : (
                                            <>
                                                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                                Desconectado
                                            </>
                                        )}
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                    {app.name}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed h-12">
                                    {app.description}
                                </p>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleConfigure(app)}
                                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${app.status === 'connected'
                                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20'
                                            }`}
                                    >
                                        <Cog6ToothIcon className="w-5 h-5" />
                                        {app.status === 'connected' ? 'Configurar' : 'Conectar'}
                                    </button>
                                    <a
                                        href={app.docsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                        title="Documentación Oficial"
                                    >
                                        <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Configuration Modal */}
            {isConfigModalOpen && selectedApp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-800 animate-scaleIn">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                                <selectedApp.icon className={`w-6 h-6 text-${selectedApp.color}-500`} />
                                Configurar {selectedApp.name}
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                <XCircleIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8">
                            <div className="space-y-6">
                                {selectedApp.id === 'whatsapp' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Phone Number ID</label>
                                            <input type="text" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="100609346..." />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">WABA ID</label>
                                            <input type="text" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="104938..." />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Permanent Token</label>
                                            <input type="password" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="EAAG..." />
                                        </div>
                                    </>
                                )}

                                {selectedApp.id === 'instagram' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Page ID (Linked)</label>
                                            <input type="text" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="102938..." />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Access Token</label>
                                            <input type="password" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="EAAG..." />
                                        </div>
                                    </>
                                )}

                                {selectedApp.id === 'telegram' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Bot Token</label>
                                            <input type="password" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="123456:ABC-DEF..." />
                                            <p className="text-xs text-slate-400 mt-2">Obtenlo de @BotFather</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
                            <button
                                onClick={handleCloseModal}
                                className="px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    toast.success('Configuración guardada (Simulado)');
                                    handleCloseModal();
                                }}
                                className="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25 transition-all"
                            >
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Apps() {
    return (
        <Sidebard>
            <AppsContent />
        </Sidebard>
    );
}
