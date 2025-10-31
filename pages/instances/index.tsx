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
    try {
      await axios.post('/api/instances');
      toast.success('Nueva instancia creada con éxito');
      
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
    <div className="">
      <Toaster richColors position="top-right" />


      <div className="flex">


        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Bienvenido, {username}</h1>

          <div className="mb-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tus Sesiones ❤️❤️</h2>
              {sessions.length === 0 ? (
                <button
                  onClick={createNewInstance}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition"
                >
                  <SparklesIcon className="w-5 h-5" />
                  Activa tu Prueba gratuita por 7 días aquí
                </button>
              ) : (
                <button
                  onClick={createNewInstance}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition"
                >
                  <PlusIcon className="w-5 h-5" />

                  Nueva Instancia
                </button>
              )}

            </div>


            {error && <p className="text-red-500 mb-4">{error.message || 'Error al cargar las sesiones.'}</p>}

            {loadingSessions ? (
              <p className="text-gray-600 dark:text-zinc-400">Cargando sesiones...</p>
            ) : sessions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
                {sessions.map((session) => (
                  <div
                    key={session.documentId}
                    className="bg-white dark:bg-zinc-900/50 rounded-lg shadow-lg dark:shadow-emerald-800 p-3 border border-gray-200 dark:border-zinc-700"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={session.profilePicUrl || profiles[session.documentId]?.profilePicUrl || '/logo/profile.png'}
                          alt="Profile"
                          className="w-16 h-16 border-4 border-emerald-500 rounded-full object-cover shadow-lg"
                          onError={(e) => (e.currentTarget.src = '/logo/profile.png')}
                        />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {session.name || profiles[session.documentId]?.name || 'Instancia'}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-zinc-400">
                            {session.phoneNumber || profiles[session.documentId]?.number || 'Número no disponible'}
                          </p>
                        </div>
                      </div>                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${{
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
                              className={`flex items-center justify-center w-8 h-8 rounded-full transition ${session.is_active
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-gray-600 hover:bg-gray-700 text-white'
                                }`}
                              title={session.is_active ? 'Pausar instancia' : 'Activar instancia'}
                            >
                              {session.is_active ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                            </button>
                            <button
                              onClick={() => DisconnectInstance(session.documentId)}
                              className="flex items-center justify-center w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white transition"
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
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-600 hover:bg-slate-700 text-white transition"
                            title="Configurar webhook"
                          >
                            <Cog6ToothIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="text-zinc-400 font-medium block mb-1">Webhook:</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={webhookInputs[session.documentId] || ''}
                            onChange={(e) => handleWebhookChange(session.documentId, e.target.value)}
                            placeholder="https://ejemplo.com/webhook"
                            className="p-2 w-full text-gray-900 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <button
                            onClick={() => updateWebhook(session.documentId)}
                            className="bg-emerald-600 text-white px-3 py-2 rounded-md hover:bg-emerald-700 transition"
                          >
                            Guardar
                          </button>
                        </div>
                      </div>



                      {(session.state === 'Disconnected' || session.state === 'Initializing') && (





                        <div>






                          {session.qr ? (
                            <>
                              <label className="text-zinc-400 font-medium block mb-1">Escanea este QR:</label>
                              <Image

                                width={400}
                                height={400}
                                src={session.qr}
                                alt="WhatsApp QR"
                                className="w-48 h-48 mx-auto"
                                onError={(e) => console.error('Error al cargar QR:', e)}
                              />


                              <p className="text-xs text-zinc-400 mt-2 text-center">
                                Escanea con WhatsApp / Ajustes / Dispositivos vinculados
                              </p>
                            </>
                          ) : session.qr_loading ? (
                            <div className="flex justify-center items-center">
                              <span className="text-zinc-400 text-sm">Generando QR...</span>
                              {/* Puedes agregar un spinner animado si lo deseas */}
                              <svg className="animate-spin h-5 w-5 ml-2 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            </div>
                          ) : (
                            <div className="flex justify-center items-center">
                              <button
                                onClick={async () => {
                                  await fetchQrsForDisconnectedSessions(session.documentId);
                                }}
                                className="bg-emerald-600 text-white px-3 py-2 rounded-md hover:bg-emerald-700 transition"
                              >
                                Genera un nuevo QR
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
              <p className="text-zinc-400">No tienes sesiones aún. Crea una nueva instancia.</p>
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
        <div className="fixed inset-0 bg-black/40 dark:bg-zinc/40 bg-opacity-50 shadow-md flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg p-6 w-full max-w-md shadow-2xl">
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