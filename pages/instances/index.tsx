'use client';
import { SessionProvider, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Sidebard from '../components/dashboard/index';
import Helpme from '../components/instances/helpme';
import Image from 'next/image';

import { PauseIcon, PlayIcon, XMarkIcon, PowerIcon, Cog6ToothIcon, SparklesIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Toaster, toast } from 'sonner';
import useSWR from 'swr';
import SidebarComponent from '../components/SidebarComponent';

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

  // Define the fetcher function for SWR
  const fetcher = async (url: string, token: string) => {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      console.error(`Error en respuesta: ${res.status} ${res.statusText}`);
      throw new Error(`Error API: ${res.status}`);
    }

    const data = await res.json();

    // Transform the response data into WhatsAppSession format
    const fetchedSessions: WhatsAppSession[] = data.instances.map((item: any) => ({
      id: item.id,
      documentId: item.document_id || item.documentId, // Supabase usa document_id
      webhook_url: item.webhook_url || null,
      state: item.state,
      is_active: item.is_active,
      message_received: item.message_received || false,
      message_sent: item.message_sent || false,
      qr: item.qr || null,
      qr_loading: item.qr_loading || false,
      name: item.profile_name || null, // Nombre del perfil
      profilePicUrl: item.profile_pic_url || null, // Foto del perfil
      phoneNumber: item.phone_number || null, // Número de teléfono
    }));

    return fetchedSessions;
  };

  // Determinar intervalo de actualización dinámico
  const hasInitializingSessions = sessions.some(s => s.state === 'Initializing' || s.state === 'Disconnected');
  const refreshInterval = hasInitializingSessions ? 500 : 3000; // 500ms si hay QR pendiente, 3s normal

  // Fetch user sessions using SWR
  const { data: fetchedSessions, error, isLoading: loadingSessions, mutate } = useSWR(
    typedSession?.id
      ? `/api/instances?token=${typedSession.jwt}`
      : null,
    (url) => fetcher(url, ''),
    {
      refreshInterval, // Dinámico: 500ms para QR, 3s normal
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 200, // Reducido para QR más rápido
      refreshWhenHidden: true, // Actualizar aunque la pestaña esté oculta
      refreshWhenOffline: false,
    }
  );

  // Update sessions and webhook inputs when fetchedSessions changes
  useEffect(() => {
    if (fetchedSessions) {
      setSessions(fetchedSessions);

      // Log QR updates para debugging
      fetchedSessions.forEach(session => {
        if (session.qr) {
          console.log(`✅ QR recibido para ${session.documentId} (${session.qr.length} chars)`);
        } else if (session.state === 'Initializing') {
          console.log(`⏳ Esperando QR para ${session.documentId}...`);
        }
      });

      // Initialize webhook inputs
      const initialWebhooks = fetchedSessions.reduce(
        (acc, session) => ({
          ...acc,
          [session.documentId]: session.webhook_url || '',
        }),
        {}
      );
      setWebhookInputs(initialWebhooks);

      // Los datos del perfil ya vienen en fetchedSessions
      // No necesitamos hacer llamadas adicionales
    }
  }, [fetchedSessions]);

  // Handle authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchQrsForDisconnectedSessions = async (documentId: string) => {
    const disconnectedSession = sessions.find(
      (session) => (session.state === 'Disconnected' || session.state === 'Initializing') && session.documentId === documentId
    );

    if (!disconnectedSession) {
      console.warn(`No disconnected or initializing session found for documentId: ${documentId}`);
      return;
    }

    try {
      await axios.post(
        '/api/instances/qr',
        { clientId: documentId },
        { headers: { 'Content-Type': 'application/json' ,
                      'token': typedSession?.jwt,

        } }
      );
    } catch (error: any) {
            toast.error(error.response?.data?.message || `Error fetching QR for ${documentId}:`);

    }
  };


  const createNewInstance = async () => {
    // Cargar proxies disponibles
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await axios.get(`${backendUrl}/api/proxies`);
      setAvailableProxies(response.data.proxies || []);
      setSelectedProxy('');
      setProxyInstanceId(null);
      setShowProxyModal(true);
    } catch (error: any) {
      console.error('Error al cargar proxies:', error);
      // Si no hay proxies, crear instancia sin proxy
      await createInstanceWithProxy(null);
    }
  };

  const createInstanceWithProxy = async (proxyId: string | null) => {
    try {
      const response = await axios.post('/api/instances', { proxy_id: proxyId });
      toast.success('Nueva instancia creada con éxito');
      setShowProxyModal(false);
      
      // Forzar actualización inmediata para obtener el QR rápido
      setTimeout(() => mutate(), 100);
      setTimeout(() => mutate(), 500);
      setTimeout(() => mutate(), 1000);
    } catch (error: any) {
      console.error('Error al crear nueva instancia:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Error al crear nueva instancia');
    }
  };


  const updateWebhook = async (documentId: string) => {
    try {
      const webhookUrl = webhookInputs[documentId];
      await axios.put(
        `/api/instances/webhook?documentId=${documentId}`,
        { webhook_url: webhookUrl },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      toast.success('Webhook actualizado con éxito');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al actualizar el webhook');
    }
  };



  const handleWebhookChange = (documentId: string, value: string) => {
    setWebhookInputs((prev) => ({
      ...prev,
      [documentId]: value,
    }));
  };

  // Función eliminada - Los datos del perfil ya vienen en fetchedSessions

  const toggleInstanceActive = async (documentId: string, currentActiveState: boolean) => {
    try {
      const newActiveState = !currentActiveState;
      await axios.put(
        `/api/instances?documentId=${documentId}`,
        { data: { is_active: newActiveState } },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      toast.success(`Instancia ${newActiveState ? 'activada' : 'pausada'} con éxito`);
    } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al alternar estado de la instancia:');

    }
  };

  const DisconnectInstance = async (documentId: string) => {
    try {
      await axios.post(
        `/api/instances/disconnect/${documentId}`,
        {},
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
      toast.success('Sesión desconectada con éxito');
    } catch (error: any) {
      console.error('Error al desconectar la instancia:', error.response?.data || error.message);
      toast.error('Error al desconectar la instancia');
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
        {
          headers: {
        'Content-Type': 'application/json',
          },
        }
      );
      toast.success('Configuración de webhook actualizada con éxito');
      setIsModalOpen(false);
    } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al actualizar configuración de webhook');
    }
  };


  return (
    <div className="min-h-screen">
      <Toaster richColors position="top-right" expand={true} closeButton />
      <div className="flex">


        <div className="p-6 sm:p-8 w-full bg-gradient-to-br from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-800">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">Bienvenido</h1>
            <p className="text-lg text-gray-600 dark:text-zinc-400">{username} 👋</p>
          </div>

          <div className="mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <SparklesIcon className="w-7 h-7 text-emerald-500" />
                Tus Instancias WhatsApp
              </h2>
              <button
                onClick={createNewInstance}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transform hover:scale-105 active:scale-95 font-semibold"
              >
                <PlusIcon className="w-5 h-5" />
                {sessions.length === 0 ? 'Crear Primera Instancia' : 'Nueva Instancia'}
              </button>
            </div>


            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-red-600 dark:text-red-400 text-sm">{error.message || 'Error al cargar las sesiones.'}</p>
              </div>
            )}

            {loadingSessions ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-zinc-400">Cargando instancias...</p>
                </div>
              </div>
            ) : sessions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
                {sessions.map((session) => (
                  <div
                    key={session.documentId}
                    className="group bg-white dark:bg-zinc-800 rounded-2xl shadow-lg hover:shadow-2xl dark:shadow-none border border-gray-200 dark:border-zinc-700 p-6 transition-all duration-300 hover:border-emerald-400 dark:hover:border-emerald-500"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img
                            src={session.profilePicUrl || profiles[session.documentId]?.profilePicUrl || '/logo/profile.png'}
                            alt="Profile"
                            className="w-20 h-20 border-4 border-emerald-500 rounded-full object-cover shadow-lg ring-4 ring-emerald-500/20"
                            onError={(e) => (e.currentTarget.src = '/logo/profile.png')}
                          />
                          {session.state === 'Connected' && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white dark:border-zinc-800 animate-pulse"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {session.name || profiles[session.documentId]?.name || 'Instancia'}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1">
                            <span>📞</span>
                            {session.phoneNumber || profiles[session.documentId]?.number || 'Número no disponible'}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`px-3 py-1.5 text-xs font-semibold rounded-full ${{
                            Initializing: 'bg-yellow-100 text-yellow-800',
                            Connected: 'bg-emerald-100 text-emerald-800',
                            Failure: 'bg-orange-100 text-orange-800',
                            Disconnected: 'bg-red-100 text-red-800',
                          }[session.state] || 'bg-gray-100 text-gray-800'
                            }`}
                        >
                          {session.state}
                        </span>
                        {session.state === 'Connected' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleInstanceActive(session.documentId, session.is_active)}
                              className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 shadow-lg transform hover:scale-110 active:scale-95 ${session.is_active
                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-emerald-500/30'
                                : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white shadow-gray-500/30'
                                }`}
                              title={session.is_active ? 'Pausar instancia' : 'Activar instancia'}
                            >
                              {session.is_active ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                            </button>
                            <button
                              onClick={() => DisconnectInstance(session.documentId)}
                              className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all duration-300 shadow-lg shadow-red-500/30 transform hover:scale-110 active:scale-95"
                              title="Desconectar instancia"
                            >
                              <PowerIcon className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                        {/* {session.state === 'Failure' && (
                        <button
                          onClick={() => deleteInstance(session.documentId)}
                          className="text-red-500 hover:text-red-700"
                          title="Eliminar instancia"
                        >
                          <XMarkIcon className="w-5 h-5 font-bold" />
                        </button>
                      )} */}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-zinc-400 text-sm truncate max-w-md">
                          <span className="font-bold">ID:</span> {session.documentId}
                        </p>
                        {session.state === 'Connected' && (
                          <button
                            onClick={() => ConfigInstance(session.documentId)}
                            className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white transition-all duration-300 shadow-lg shadow-cyan-500/30 transform hover:scale-110 active:scale-95"
                            title="Configurar webhook"
                          >
                            <Cog6ToothIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="text-gray-700 dark:text-zinc-300 font-semibold block mb-2">Webhook URL:</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={webhookInputs[session.documentId] || ''}
                            onChange={(e) => handleWebhookChange(session.documentId, e.target.value)}
                            placeholder="https://ejemplo.com/webhook"
                            className="p-3 w-full text-gray-900 dark:text-white bg-white dark:bg-zinc-700 border-2 border-gray-300 dark:border-zinc-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                          />
                          <button
                            onClick={() => updateWebhook(session.documentId)}
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg shadow-emerald-500/30 font-semibold whitespace-nowrap"
                          >
                            Guardar
                          </button>
                        </div>
                      </div>



                      {(session.state === 'Disconnected' || session.state === 'Initializing') && (
                        <div className="mt-4">
                          {session.qr ? (
                            <div className="bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50 dark:from-emerald-900/20 dark:via-cyan-900/20 dark:to-blue-900/20 p-6 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800">
                              <label className="text-gray-900 dark:text-white font-bold block mb-4 text-center flex items-center justify-center gap-2">
                                <SparklesIcon className="w-5 h-5 text-emerald-500" />
                                Escanea este QR con WhatsApp
                              </label>
                              <div className="bg-white p-4 rounded-xl shadow-lg mx-auto w-fit">
                                <Image
                                  width={400}
                                  height={400}
                                  src={session.qr}
                                  alt="WhatsApp QR"
                                  className="w-56 h-56"
                                  onError={(e) => console.error('Error al cargar QR:', e)}
                                />
                              </div>
                              <p className="text-xs text-gray-600 dark:text-zinc-400 mt-4 text-center">
                                📱 WhatsApp → Ajustes → Dispositivos vinculados → Vincular dispositivo
                              </p>
                            </div>
                          ) : session.qr_loading ? (
                            <div className="flex flex-col justify-center items-center py-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-800 dark:to-zinc-900 rounded-2xl border-2 border-dashed border-gray-300 dark:border-zinc-700">
                              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                              <span className="text-gray-700 dark:text-zinc-300 text-sm font-semibold">Generando QR...</span>
                              <span className="text-gray-500 dark:text-zinc-500 text-xs mt-1">Esto puede tomar unos segundos</span>
                            </div>
                          ) : (
                            <div className="flex justify-center items-center py-8">
                              <button
                                onClick={async () => {
                                  await fetchQrsForDisconnectedSessions(session.documentId);
                                }}
                                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transform hover:scale-105 active:scale-95 font-bold"
                              >
                                <SparklesIcon className="w-5 h-5" />
                                Generar Nuevo QR
                              </button>
                            </div>
                          )}
                        </div>
                      )}



                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-800 dark:to-zinc-900 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl max-w-md mx-auto">
                  <SparklesIcon className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-zinc-500" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No tienes instancias aún</h3>
                  <p className="text-gray-600 dark:text-zinc-400 text-sm mb-6">Crea tu primera instancia de WhatsApp para comenzar</p>
                  <button
                    onClick={createNewInstance}
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transform hover:scale-105 active:scale-95 font-bold mx-auto"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Crear Primera Instancia
                  </button>
                </div>
              </div>
            )}




          </div>


          {/* <div>
            <p className="text-zinc-400 mt-4">
              Si tienes dudas de cómo usar la herramienta, consulta nuestra documentación para utilizar la API.
            </p>

          </div> */}
        </div>



        <Helpme>

        </Helpme>



      </div>



      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 dark:bg-zinc/40 bg-opacity-50 shadow-md flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg p-4 sm:p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Configurar Webhook</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={webhookSettings.message_received}
                  onChange={(e) =>
                    setWebhookSettings((prev) => ({
                      ...prev,
                      message_received: e.target.checked,
                    }))
                  }
                  className="mr-2"
                />
                <label className="text-zinc-400">Recibir mensajes (message_received)</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={webhookSettings.message_sent}
                  onChange={(e) =>
                    setWebhookSettings((prev) => ({
                      ...prev,
                      message_sent: e.target.checked,
                    }))
                  }
                  className="mr-2"
                />
                <label className="text-zinc-400">Mensajes enviados (message_sent)</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-zinc-600 text-white px-4 py-2 rounded-md hover:bg-zinc-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={saveWebhookSettings}
                className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de selección de proxy */}
      {showProxyModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-zinc/40 bg-opacity-50 shadow-md flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg p-4 sm:p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {proxyInstanceId ? 'Asignar Proxy a Instancia' : 'Crear Nueva Instancia'}
              </h3>
              <button onClick={() => setShowProxyModal(false)} className="text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Seleccionar Proxy (Opcional)
                </label>
                <select
                  value={selectedProxy}
                  onChange={(e) => setSelectedProxy(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Sin proxy</option>
                  {availableProxies.filter(p => p.is_active && p.is_healthy).map((proxy) => (
                    <option key={proxy.id} value={proxy.id}>
                      {proxy.name} ({proxy.type}) - {proxy.host}:{proxy.port}
                      {proxy.country ? ` [${proxy.country}]` : ''}
                    </option>
                  ))}
                </select>
                {availableProxies.length === 0 && (
                  <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
                    No hay proxies disponibles. Puedes crear uno en la sección de Proxies.
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowProxyModal(false)}
                className="bg-zinc-600 text-white px-4 py-2 rounded-md hover:bg-zinc-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => createInstanceWithProxy(selectedProxy || null)}
                className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition"
              >
                {proxyInstanceId ? 'Asignar Proxy' : 'Crear Instancia'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );


}

export default function Dashboard() {
  return (
    <Sidebard>
      <DashboardContent />
    </Sidebard>
  );
}