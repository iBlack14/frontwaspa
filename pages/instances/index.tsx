'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Sidebar from '../components/dashboard/index';
import Helpme from '../components/instances/helpme';
import Image from 'next/image';
import {
  PauseIcon,
  PlayIcon,
  XMarkIcon,
  PowerIcon,
  Cog6ToothIcon,
  SparklesIcon,
  PlusIcon,
  QrCodeIcon,
  SignalIcon,
  SignalSlashIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { Toaster, toast } from 'sonner';
import useSWR from 'swr';

interface CustomSession {
  id?: string;
  jwt?: string;
  firstName?: string;
}

interface WhatsAppSession {
  id: number;
  documentId: string;
  user: string;
  webhook_url: string | null;
  is_active: boolean;
  state: string;
  name?: string;
  profilePicUrl?: string | null;
  phoneNumber?: string | null;
  message_received?: boolean;
  message_sent?: boolean;
  qr?: string;
  qr_loading?: boolean;
}

function DashboardContent() {
  const { data: session, status } = useSession();
  const username = useSession().data?.username;
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const typedSession = session as CustomSession | null;
  const router = useRouter();
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [webhookInputs, setWebhookInputs] = useState<{ [key: string]: string }>({});
  const [profiles, setProfiles] = useState<{ [key: string]: { name?: string; profilePicUrl?: string | null; number?: string | null } }>({});

  const [webhookSettings, setWebhookSettings] = useState<{
    message_received: boolean;
    message_sent: boolean;
  }>({ message_received: false, message_sent: false });

  // Estados para proxy
  const [showProxyModal, setShowProxyModal] = useState(false);
  const [availableProxies, setAvailableProxies] = useState<any[]>([]);
  const [selectedProxy, setSelectedProxy] = useState<string>('');
  const [proxyInstanceId, setProxyInstanceId] = useState<string | null>(null);

  const fetcher = async (url: string, token: string) => {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      throw new Error(`Error API: ${res.status}`);
    }
    const data = await res.json();
    return data.instances.map((item: any) => ({
      id: item.id,
      documentId: item.document_id || item.documentId,
      webhook_url: item.webhook_url || null,
      state: item.state,
      is_active: item.is_active,
      message_received: item.message_received || false,
      message_sent: item.message_sent || false,
      qr: item.qr || null,
      qr_loading: item.qr_loading || false,
      name: item.profile_name || null,
      profilePicUrl: item.profile_pic_url || null,
      phoneNumber: item.phone_number || null,
    }));
  };

  const hasInitializingSessions = sessions.some(s => s.state === 'Initializing' || s.state === 'Disconnected');
  const refreshInterval = hasInitializingSessions ? 1000 : 5000;

  const { data: fetchedSessions, error, isLoading: loadingSessions, mutate } = useSWR(
    typedSession?.id ? `/api/instances?token=${typedSession.jwt}` : null,
    (url) => fetcher(url, ''),
    {
      refreshInterval,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 500,
      refreshWhenHidden: true,
      onError: (err) => setTimeout(() => mutate(), 2000),
    }
  );

  useEffect(() => {
    if (fetchedSessions) {
      setSessions(fetchedSessions);
      const initialWebhooks = fetchedSessions.reduce(
        (acc: any, session: WhatsAppSession) => ({
          ...acc,
          [session.documentId]: session.webhook_url || '',
        }),
        {}
      );
      setWebhookInputs(initialWebhooks);
    }
  }, [fetchedSessions]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchQrsForDisconnectedSessions = async (documentId: string) => {
    try {
      await axios.post(
        '/api/instances/qr',
        { clientId: documentId },
        { headers: { 'Content-Type': 'application/json', 'token': typedSession?.jwt } }
      );
      toast.success('Solicitando QR...');
      mutate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Error al generar QR`);
    }
  };

  const createNewInstance = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await axios.get(`${backendUrl}/api/proxies`);
      setAvailableProxies(response.data.proxies || []);
      setSelectedProxy('');
      setProxyInstanceId(null);
      setShowProxyModal(true);
    } catch (error) {
      await createInstanceWithProxy(null);
    }
  };

  const createInstanceWithProxy = async (proxyId: string | null) => {
    try {
      await axios.post('/api/instances', { proxy_id: proxyId });
      toast.success('Nueva instancia creada con éxito');
      setShowProxyModal(false);
      mutate();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear instancia');
    }
  };

  const updateWebhook = async (documentId: string) => {
    try {
      const webhookUrl = webhookInputs[documentId];
      await axios.put(
        `/api/instances/webhook?documentId=${documentId}`,
        { webhook_url: webhookUrl },
        { headers: { 'Content-Type': 'application/json' } }
      );
      toast.success('Webhook actualizado');
    } catch (error: any) {
      toast.error('Error al actualizar webhook');
    }
  };

  const toggleInstanceActive = async (documentId: string, currentActiveState: boolean) => {
    try {
      await axios.put(
        `/api/instances?documentId=${documentId}`,
        { data: { is_active: !currentActiveState } },
        { headers: { 'Content-Type': 'application/json' } }
      );
      toast.success(`Instancia ${!currentActiveState ? 'activada' : 'pausada'}`);
      mutate();
    } catch (error: any) {
      toast.error('Error al cambiar estado');
    }
  };

  const DisconnectInstance = async (documentId: string) => {
    try {
      await axios.post(
        `/api/instances/disconnect/${documentId}`,
        {},
        { headers: { 'Content-Type': 'application/json' } }
      );
      toast.success('Desconectado correctamente');
      mutate();
    } catch (error: any) {
      toast.error('Error al desconectar');
    }
  };

  const ConfigInstance = async (documentId: string) => {
    const session = sessions.find((s) => s.documentId === documentId);
    if (session) {
      setWebhookSettings({
        message_received: session.message_received || false,
        message_sent: session.message_sent || false,
      });
      setSelectedDocumentId(documentId);
      setIsModalOpen(true);
    }
  };

  const saveWebhookSettings = async () => {
    if (!selectedDocumentId) return;
    try {
      await axios.put(
        `/api/instances?documentId=${selectedDocumentId}`,
        {
          data: {
            message_received: webhookSettings.message_received,
            message_sent: webhookSettings.message_sent,
          },
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      toast.success('Configuración guardada');
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error('Error al guardar configuración');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-transparent">
      <Toaster richColors position="top-right" />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto flex items-start gap-6">
        <div className="flex-1 w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Mis Instancias</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Gestiona tus conexiones de WhatsApp</p>
            </div>
            <button
              onClick={createNewInstance}
              className="group flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              <span className="font-medium">Nueva Instancia</span>
            </button>
          </div>

          {/* Content */}
          {loadingSessions ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : sessions.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sessions.map((session) => (
                <div
                  key={session.documentId}
                  className="group bg-white dark:bg-[#1e293b] rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {session.profilePicUrl ? (
                          <img
                            src={session.profilePicUrl}
                            alt="Profile"
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 dark:border-slate-700 shadow-sm"
                            onError={(e) => (e.currentTarget.src = '/logo/profile.png')}
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center border-2 border-indigo-100 dark:border-indigo-800/30">
                            <span className="text-2xl font-bold text-indigo-500">{session.name?.[0] || 'W'}</span>
                          </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-[#1e293b] ${session.state === 'Connected' ? 'bg-emerald-500' : 'bg-red-500'
                          }`}></div>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                          {session.name || 'WhatsApp Instance'}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          {session.phoneNumber || session.documentId.substring(0, 12) + '...'}
                        </p>
                        <span className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg text-xs font-medium ${session.state === 'Connected'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                            : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                          {session.state === 'Connected' ? <SignalIcon className="w-3 h-3" /> : <SignalSlashIcon className="w-3 h-3" />}
                          {session.state}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    {session.state === 'Connected' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleInstanceActive(session.documentId, session.is_active)}
                          className={`p-2 rounded-xl transition-colors ${session.is_active
                              ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          title={session.is_active ? 'Pausar' : 'Activar'}
                        >
                          {session.is_active ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => ConfigInstance(session.documentId)}
                          className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 transition-colors"
                          title="Configurar"
                        >
                          <Cog6ToothIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => DisconnectInstance(session.documentId)}
                          className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 transition-colors"
                          title="Desconectar"
                        >
                          <PowerIcon className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Webhook Section */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-4">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Webhook URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={webhookInputs[session.documentId] || ''}
                        onChange={(e) => setWebhookInputs({ ...webhookInputs, [session.documentId]: e.target.value })}
                        placeholder="https://tu-api.com/webhook"
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      />
                      <button
                        onClick={() => updateWebhook(session.documentId)}
                        className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>

                  {/* QR Section */}
                  {(session.state === 'Disconnected' || session.state === 'Initializing') && (
                    <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-6">
                      {session.qr ? (
                        <div className="flex flex-col items-center">
                          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-4">
                            <Image src={session.qr} alt="QR" width={200} height={200} className="w-48 h-48" />
                          </div>
                          <p className="text-sm text-slate-500 flex items-center gap-2">
                            <SparklesIcon className="w-4 h-4 text-indigo-500" />
                            Escanea con WhatsApp
                          </p>
                        </div>
                      ) : session.qr_loading ? (
                        <div className="flex flex-col items-center py-8">
                          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                          <p className="text-sm text-slate-500">Generando código QR...</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => fetchQrsForDisconnectedSessions(session.documentId)}
                          className="w-full py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors flex items-center justify-center gap-2"
                        >
                          <QrCodeIcon className="w-5 h-5" />
                          Generar Código QR
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-100 dark:border-slate-800 border-dashed">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-4">
                <SparklesIcon className="w-8 h-8 text-indigo-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Comienza ahora</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6 text-center max-w-md">
                No tienes ninguna instancia activa. Crea una nueva para empezar a enviar y recibir mensajes.
              </p>
              <button
                onClick={createNewInstance}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                Crear Instancia
              </button>
            </div>
          )}
        </div>

        {/* Helpme Sidebar */}
        <Helpme />
      </div>

      {/* Modals */}
      {(isModalOpen || showProxyModal) && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-800 transform transition-all scale-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                {showProxyModal ? 'Configurar Proxy' : 'Opciones de Webhook'}
              </h3>
              <button
                onClick={() => { setIsModalOpen(false); setShowProxyModal(false); }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {showProxyModal ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Proxy (Opcional)</label>
                  <select
                    value={selectedProxy}
                    onChange={(e) => setSelectedProxy(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-slate-700 dark:text-slate-200"
                  >
                    <option value="">Sin proxy</option>
                    {availableProxies.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} - {p.host}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowProxyModal(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => createInstanceWithProxy(selectedProxy || null)}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Crear
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Recibir mensajes</span>
                  <input
                    type="checkbox"
                    checked={webhookSettings.message_received}
                    onChange={(e) => setWebhookSettings(p => ({ ...p, message_received: e.target.checked }))}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Mensajes enviados</span>
                  <input
                    type="checkbox"
                    checked={webhookSettings.message_sent}
                    onChange={(e) => setWebhookSettings(p => ({ ...p, message_sent: e.target.checked }))}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveWebhookSettings}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <Sidebar>
      <DashboardContent />
    </Sidebar>
  );
}