import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Sidebar from '../../components/dashboard/index';
import Helpme from '../../components/instances/helpme';
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
  TrashIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
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
  const { session, status } = useAuth();
  const username = session?.username;
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const typedSession = session as any;
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
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    const fetchUserData = async () => {
      if (typedSession?.jwt) {
        try {
          const response = await axios.post('/api/user/get', {
            jwt: typedSession.jwt,
          });
          setApiKey(response.data.key || '');
        } catch (error) {
          console.error('Error fetching user key:', error);
        }
      }
    };
    fetchUserData();
  }, [typedSession]);

  const fetcher = async (url: string) => {
    const res = await fetch(url, {
      credentials: 'include', // Include cookies for Supabase auth
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
    typedSession?.id ? `/api/instances` : null,
    fetcher,
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
      // Si no hay API Key, no intentar cargar proxies para evitar error 401 en backend
      if (!apiKey) {
        setAvailableProxies([]);
        setSelectedProxy('');
        setProxyInstanceId(null);
        setShowProxyModal(true);
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await axios.get(`${backendUrl}/api/proxies`, {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      });
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
    <div className="min-h-screen bg-gradient-to-b from-white/50 to-slate-50/50 dark:from-slate-900/20 dark:to-slate-950/30">


      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto flex items-start gap-6">
        <div className="flex-1 w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1.5 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
                <h1 className="text-4xl font-bold text-slate-800 dark:text-white tracking-tight">Mis Instancias</h1>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mt-2 font-medium">Gestiona y controla tus conexiones de WhatsApp en tiempo real</p>
            </div>
            <button
              onClick={createNewInstance}
              className="group flex items-center gap-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white px-6 py-3 rounded-xl hover:shadow-xl hover:shadow-indigo-500/30 dark:hover:shadow-indigo-900/30 transition-all duration-300 transform hover:-translate-y-0.5 font-semibold whitespace-nowrap border border-indigo-500/20 dark:border-indigo-800/30"
            >
              <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              <span>Nueva Instancia</span>
            </button>
          </div>

          {/* Content */}
          {loadingSessions ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-800/60 rounded-3xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-sm animate-pulse">
                  <div className="flex gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-2xl"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-5 bg-slate-300 dark:bg-slate-700 rounded-lg w-2/3"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded-lg w-1/3"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded-lg w-full"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded-lg w-4/5"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : sessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {sessions.map((session) => (
                <div
                  key={session.documentId}
                  className="group bg-gradient-to-br from-white to-slate-50 dark:from-slate-800/80 dark:to-slate-900/50 rounded-3xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-xl hover:shadow-indigo-500/20 dark:hover:shadow-indigo-900/20 transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between mb-6 pb-4 border-b border-slate-100/50 dark:border-slate-700/30">
                    <div className="flex items-center gap-4">
                      <div className="relative group/avatar">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-3xl opacity-0 group-hover/avatar:opacity-20 blur transition duration-300"></div>
                        {session.profilePicUrl ? (
                          <img
                            src={session.profilePicUrl}
                            alt="Profile"
                            className="relative w-16 h-16 rounded-3xl object-cover border-2 border-white dark:border-slate-800 shadow-md"
                            onError={(e) => (e.currentTarget.src = '/logo/profile.png')}
                          />
                        ) : (
                          <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-200 to-purple-200 dark:from-indigo-800 dark:to-purple-800 flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-md">
                            <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-200">{session.name?.[0] || 'W'}</span>
                          </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2.5 border-white dark:border-slate-800 shadow-md ${session.state === 'Connected' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                          }`}></div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white truncate max-w-xs">
                          {session.name || 'WhatsApp Instance'}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-1 font-medium">
                          {session.phoneNumber || 'Sin número'}
                        </p>
                        <div className="flex items-center gap-2 mt-3 group/id cursor-pointer w-fit" onClick={() => {
                          navigator.clipboard.writeText(session.documentId);
                          toast.success('ID copiado al portapapeles');
                        }}>
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800/60 dark:to-slate-800/30 border border-slate-200/50 dark:border-slate-700/50 hover:border-indigo-300/50 dark:hover:border-indigo-700/50 transition-all duration-300 shadow-sm">
                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">ID</span>
                            <p className="text-xs text-slate-600 dark:text-slate-300 font-mono font-semibold">
                              {session.documentId.substring(0, 8)}...
                            </p>
                            <ClipboardDocumentIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover/id:text-indigo-600 dark:group-hover/id:text-indigo-400 transition-colors" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${session.state === 'Connected'
                            ? 'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 dark:from-emerald-900/30 dark:to-emerald-900/20 dark:text-emerald-300 shadow-sm'
                            : 'bg-gradient-to-r from-red-100 to-red-50 text-red-700 dark:from-red-900/30 dark:to-red-900/20 dark:text-red-300 shadow-sm'
                            }`}>
                            {session.state === 'Connected' ? (
                              <>
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                Conectado
                              </>
                            ) : (
                              <>
                                <SignalSlashIcon className="w-4 h-4" />
                                {session.state}
                              </>
                            )}
                          </span>
                          {session.is_active && session.state === 'Connected' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 shadow-sm">
                              <SignalIcon className="w-3.5 h-3.5" />
                              Activo
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {session.state === 'Connected' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleInstanceActive(session.documentId, session.is_active)}
                          className={`p-2.5 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md ${session.is_active
                            ? 'bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-700 dark:from-indigo-900/40 dark:to-indigo-900/20 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/30 hover:border-indigo-300/50'
                            : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/30 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          title={session.is_active ? 'Pausar' : 'Activar'}
                        >
                          {session.is_active ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => ConfigInstance(session.documentId)}
                          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/30 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-300 shadow-sm hover:shadow-md"
                          title="Configurar"
                        >
                          <Cog6ToothIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => DisconnectInstance(session.documentId)}
                          className="p-2.5 rounded-xl bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/40 dark:to-red-900/20 text-red-700 dark:text-red-300 border border-red-200/50 dark:border-red-800/30 hover:border-red-300/50 transition-all duration-300 shadow-sm hover:shadow-md"
                          title="Desconectar"
                        >
                          <PowerIcon className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Webhook Section */}
                  <div className="bg-gradient-to-r from-slate-100/50 to-slate-50/50 dark:from-slate-800/30 dark:to-slate-800/20 rounded-2xl p-4 mb-4 border border-slate-200/30 dark:border-slate-700/30 shadow-sm">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-2.5 block flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                      Webhook URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={webhookInputs[session.documentId] || ''}
                        onChange={(e) => setWebhookInputs({ ...webhookInputs, [session.documentId]: e.target.value })}
                        placeholder="https://tu-api.com/webhook"
                        className="flex-1 bg-white dark:bg-slate-900/50 border border-slate-300/50 dark:border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all duration-300"
                      />
                      <button
                        onClick={() => updateWebhook(session.documentId)}
                        className="bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-600 dark:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-indigo-800 dark:hover:from-indigo-700 dark:hover:to-indigo-800 transition-all duration-300 shadow-md hover:shadow-lg active:scale-95"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>

                  {/* QR Section */}
                  {(session.state === 'Disconnected' || session.state === 'Initializing') && (
                    <div className="mt-6 pt-6 border-t border-slate-200/30 dark:border-slate-700/30">
                      {session.qr ? (
                        <div className="flex flex-col items-center animate-in fade-in duration-300">
                          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 mb-5 transform hover:scale-105 transition-transform duration-300">
                            <Image src={session.qr} alt="QR" width={200} height={200} className="w-48 h-48 rounded-xl" />
                          </div>
                          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                            <SparklesIcon className="w-4 h-4 text-indigo-500 animate-pulse" />
                            Escanea con WhatsApp
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Código válido por 30 segundos</p>
                        </div>
                      ) : session.qr_loading ? (
                        <div className="flex flex-col items-center py-8">
                          <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Generando código QR...</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Esto puede tomar unos segundos</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => fetchQrsForDisconnectedSessions(session.documentId)}
                          className="w-full py-3.5 bg-gradient-to-r from-indigo-100 to-indigo-50 dark:from-indigo-900/40 dark:to-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl font-semibold hover:from-indigo-200 hover:to-indigo-100 dark:hover:from-indigo-900/50 dark:hover:to-indigo-900/40 transition-all duration-300 flex items-center justify-center gap-2.5 border border-indigo-200/50 dark:border-indigo-800/30 shadow-sm hover:shadow-md"
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
            <div className="flex flex-col items-center justify-center py-24 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-800/60 dark:to-slate-900/40 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 border-dashed shadow-sm animate-in fade-in duration-500">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 rounded-2xl flex items-center justify-center mb-6 shadow-md">
                <SparklesIcon className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">Comienza ahora</h3>
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


// Force SSR to avoid static generation errors
export async function getServerSideProps() {
  return { props: {} };
}
