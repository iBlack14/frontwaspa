'use client';
import { SessionProvider, useSession } from 'next-auth/react';
import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/dashboard/index';
import { Toaster, toast } from 'sonner';
import { 
  ChevronDownIcon,
  ChatBubbleBottomCenterTextIcon,
  PaperAirplaneIcon,
  InboxArrowDownIcon,
  ServerIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import type { ChartOptions } from 'chart.js';

// ✅ Lazy load Chart.js - Solo se carga cuando hay datos
const LazyChart = lazy(() => import('./ChartComponent'));

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
  historycal_data: {
    date: string;
    message_sent: number;
    api_message_sent: number;
    message_received: number;
  }[];
  name?: string;
  profilePicUrl?: string | null;
  number?: string | null; 
}

function DashboardContent() {
  const { data: session, status } = useSession();
  const typedSession = session as CustomSession | null;
  const router = useRouter();
  const [instances, setInstances] = useState<WhatsAppSession[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchUserSessions();
    }
  }, [status, router]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUserSessions = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/instances');

      const fetchedSessions: WhatsAppSession[] = res.data.instances.map((item: any) => ({
        id: item.id,
        documentId: item.document_id || item.documentId, // Supabase usa snake_case
        webhook_url: item.webhook_url || null,
        state: item.state,
        is_active: item.is_active,
        historycal_data: item.historycal_data || [],
        // ✅ Datos del perfil que ya vienen en la respuesta
        name: item.profile_name || null,
        profilePicUrl: item.profile_pic_url || null,
        number: item.phone_number || null,
      }));

      // 🔄 Inicializar datos históricos si alguna instancia no tiene datos
      const instancesWithoutData = fetchedSessions.filter(
        (instance) => !instance.historycal_data || instance.historycal_data.length === 0
      );

      if (instancesWithoutData.length > 0) {
        try {
          await axios.post('/api/instances/initialize-stats', {});
          // Recargar datos después de inicializar
          const updatedRes = await axios.get('/api/instances');
          const updatedSessions: WhatsAppSession[] = updatedRes.data.instances.map((item: any) => ({
            id: item.id,
            documentId: item.document_id || item.documentId,
            webhook_url: item.webhook_url || null,
            state: item.state,
            is_active: item.is_active,
            historycal_data: item.historycal_data || [],
            name: item.profile_name || null,
            profilePicUrl: item.profile_pic_url || null,
            number: item.phone_number || null,
          }));
          setInstances(updatedSessions);
          
          // Set default selected instance
          if (updatedSessions.length > 0) {
            setSelectedInstanceId(updatedSessions[0].documentId);
            setHistoryData(updatedSessions[0].historycal_data || []);
          }
        } catch (initError) {
          console.error('Error initializing stats:', initError);
          // Si falla la inicialización, usar los datos originales
          setInstances(fetchedSessions);
          if (fetchedSessions.length > 0) {
            setSelectedInstanceId(fetchedSessions[0].documentId);
            setHistoryData(fetchedSessions[0].historycal_data || []);
          }
        }
      } else {
        setInstances(fetchedSessions);
        // Set default selected instance
        if (fetchedSessions.length > 0) {
          setSelectedInstanceId(fetchedSessions[0].documentId);
          setHistoryData(fetchedSessions[0].historycal_data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      toast.error('Failed to fetch instances. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const handleInstanceSelect = (documentId: string) => {
    setSelectedInstanceId(documentId);
    const selectedInstance = instances.find((instance) => instance.documentId === documentId);
    setHistoryData(selectedInstance?.historycal_data || []);
    setIsDropdownOpen(false);
  };

  // 🧪 Función temporal para generar datos de prueba
  const generateTestData = async (documentId: string) => {
    try {
      const res = await axios.post('/api/instances/generate-test-data', {
        documentId
      });
      toast.success('Datos de prueba generados correctamente');
      // Recargar datos
      await fetchUserSessions();
    } catch (error: any) {
      console.error('Error generando datos de prueba:', error);
      toast.error('Error al generar datos de prueba');
    }
  };

  // Get the selected instance (los datos del perfil ya están en la instancia)
  const selectedInstance = instances.find((instance) => instance.documentId === selectedInstanceId);

  // Calculate total metrics across all instances
  const calculateTotalMetrics = () => {
    let totalSent = 0;
    let totalApiSent = 0;
    let totalReceived = 0;

    instances.forEach((instance) => {
      (instance.historycal_data || []).forEach((data) => {
        totalSent += data.message_sent || 0;
        totalApiSent += data.api_message_sent || 0;
        totalReceived += data.message_received || 0;
      });
    });

    return { totalSent, totalApiSent, totalReceived };
  };

  const metrics = calculateTotalMetrics();
  const activeInstances = instances.filter((i) => i.state === 'Connected').length;
  const totalInstances = instances.length;

  const chartData = {
    labels: (historyData || []).map((data) => data.date),
    datasets: [
      {
        label: 'Messages Sent',
        data: (historyData || []).map((data) => data.message_sent),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      },
      {
        label: 'API Messages Sent',
        data: (historyData || []).map((data) => data.api_message_sent),
        borderColor: 'rgba(153, 102, 255, 1)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Messages Received',
        data: (historyData || []).map((data) => data.message_received),
        borderColor: 'rgba(255, 159, 64, 1)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    interaction: {
      mode: 'nearest',
      intersect: true,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Historical Data',
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context: any) => {
            const datasetLabel = context.dataset.label || '';
            const value = context.parsed.y;
            return `${datasetLabel}: ${value}`;
          },
        },
      },
      datalabels: {
        display: true,
        align: 'top' as const,
        formatter: (value: number) => `${value}`,
        color: '#ffff',
        font: {
          weight: 'bold' as const,
          size: 12,
        },
      },
    },
    scales: {
      x: {
        min: 0,
        max: historyData.length > 0 ? historyData.length - 1 : 0,
      },
      y: {
        min: 0,
        max: historyData.length > 0
          ? Math.max(...historyData.flatMap((data) => [
              data.message_sent,
              data.api_message_sent,
              data.message_received,
            ])) * 1.2
          : 100,
      },
    },
  };

  return (
    <div className="p-6 space-y-6">
      <Toaster richColors position="top-right" />
      
      {loading ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-zinc-400 text-lg">Cargando instancias...</p>
          </div>
        </div>
      ) : instances.length === 0 ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center bg-zinc-800/50 p-12 rounded-2xl border border-zinc-700">
            <ServerIcon className="w-20 h-20 mx-auto text-zinc-600 mb-4" />
            <p className="text-zinc-300 text-xl mb-2">No tienes instancias disponibles</p>
            <p className="text-zinc-500">Crea una nueva instancia para comenzar</p>
          </div>
        </div>
      ) : (
        <>
          {/* Header with metrics cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Instances Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 shadow-xl transform transition-transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Total Instancias</p>
                  <p className="text-white text-3xl font-bold">{totalInstances}</p>
                  <p className="text-blue-200 text-xs mt-1">{activeInstances} activas</p>
                </div>
                <ServerIcon className="w-12 h-12 text-blue-200 opacity-80" />
              </div>
            </div>

            {/* Messages Sent Card */}
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-6 shadow-xl transform transition-transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium mb-1">Mensajes Enviados</p>
                  <p className="text-white text-3xl font-bold">{metrics.totalSent.toLocaleString()}</p>
                  <p className="text-emerald-200 text-xs mt-1">Total acumulado</p>
                </div>
                <PaperAirplaneIcon className="w-12 h-12 text-emerald-200 opacity-80" />
              </div>
            </div>

            {/* API Messages Card */}
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 shadow-xl transform transition-transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-1">Mensajes API</p>
                  <p className="text-white text-3xl font-bold">{metrics.totalApiSent.toLocaleString()}</p>
                  <p className="text-purple-200 text-xs mt-1">Vía API</p>
                </div>
                <ChatBubbleBottomCenterTextIcon className="w-12 h-12 text-purple-200 opacity-80" />
              </div>
            </div>

            {/* Messages Received Card */}
            <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 shadow-xl transform transition-transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium mb-1">Mensajes Recibidos</p>
                  <p className="text-white text-3xl font-bold">{metrics.totalReceived.toLocaleString()}</p>
                  <p className="text-orange-200 text-xs mt-1">Total recibidos</p>
                </div>
                <InboxArrowDownIcon className="w-12 h-12 text-orange-200 opacity-80" />
              </div>
            </div>
          </div>

          {/* Instance Selector with Profile */}
          <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-xl font-bold flex items-center gap-2">
                <ServerIcon className="w-6 h-6 text-emerald-500" />
                Seleccionar Instancia
              </h2>
              <div className="flex items-center gap-3">
                {selectedInstanceId && (
                  <button
                    onClick={() => generateTestData(selectedInstanceId)}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                    title="Generar datos de prueba para esta instancia"
                  >
                    🧪 Generar Datos de Prueba
                  </button>
                )}
                <span className="text-zinc-400 text-sm">
                  {activeInstances}/{totalInstances} conectadas
                </span>
              </div>
            </div>

            <div className="relative" ref={dropdownRef}>
              {/* Enhanced Dropdown Trigger */}
              <div
                className="flex items-center justify-between p-4 bg-zinc-900 border-2 border-zinc-700 rounded-xl cursor-pointer hover:border-emerald-500 transition-all group"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className="flex items-center gap-4">
                  {selectedInstance?.profilePicUrl ? (
                    <img
                      src={selectedInstance.profilePicUrl}
                      alt="Profile"
                      className="w-12 h-12 rounded-full object-cover border-3 border-emerald-500 shadow-lg"
                      onError={(e) => (e.currentTarget.src = '/logo/profile.png')}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center">
                      <ServerIcon className="w-6 h-6 text-zinc-400" />
                    </div>
                  )}
                  <div>
                    <p className="text-white font-semibold text-lg">
                      {selectedInstance?.name || selectedInstance?.documentId || 'Selecciona una instancia'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {selectedInstance?.number && (
                        <span className="text-zinc-400 text-sm">{selectedInstance.number}</span>
                      )}
                      {selectedInstance && (
                        <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                          selectedInstance.state === 'Connected'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {selectedInstance.state === 'Connected' ? (
                            <CheckCircleIcon className="w-3 h-3" />
                          ) : (
                            <XCircleIcon className="w-3 h-3" />
                          )}
                          {selectedInstance.state}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronDownIcon
                  className={`w-6 h-6 text-zinc-400 group-hover:text-emerald-500 transition-all ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {/* Enhanced Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute z-10 mt-2 w-full bg-zinc-900 border-2 border-zinc-700 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                  {instances.map((instance) => {
                    const isSelected = instance.documentId === selectedInstanceId;
                    return (
                      <div
                        key={instance.documentId}
                        className={`flex items-center gap-4 p-4 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-600/20 border-l-4 border-emerald-500'
                            : 'hover:bg-zinc-800 border-l-4 border-transparent'
                        }`}
                        onClick={() => handleInstanceSelect(instance.documentId)}
                      >
                        {instance.profilePicUrl ? (
                          <img
                            src={instance.profilePicUrl}
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500"
                            onError={(e) => (e.currentTarget.src = '/logo/profile.png')}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                            <ServerIcon className="w-5 h-5 text-zinc-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-white font-medium">
                            {instance.name || instance.documentId}
                          </p>
                          {instance.number && (
                            <p className="text-zinc-400 text-sm">{instance.number}</p>
                          )}
                        </div>
                        <span
                          className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium ${
                            instance.state === 'Connected'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {instance.state === 'Connected' ? (
                            <CheckCircleIcon className="w-4 h-4" />
                          ) : (
                            <XCircleIcon className="w-4 h-4" />
                          )}
                          {instance.state}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Chart Section */}
          <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
            <h2 className="text-white text-xl font-bold mb-6 flex items-center gap-2">
              <ChatBubbleBottomCenterTextIcon className="w-6 h-6 text-emerald-500" />
              Historial de Mensajes
            </h2>
            {historyData.length > 0 ? (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-[500px]">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-emerald-500 mx-auto mb-4"></div>
                      <div className="text-zinc-400">Cargando gráfico...</div>
                    </div>
                  </div>
                }
              >
                <LazyChart data={chartData} options={chartOptions} />
              </Suspense>
            ) : (
              <div className="flex items-center justify-center h-[300px] bg-zinc-900/50 rounded-xl border-2 border-dashed border-zinc-700">
                <div className="text-center">
                  <ChatBubbleBottomCenterTextIcon className="w-16 h-16 mx-auto text-zinc-600 mb-4" />
                  <p className="text-zinc-400 text-lg">No hay datos históricos disponibles</p>
                  <p className="text-zinc-500 text-sm mt-2">Los datos aparecerán una vez que comiences a enviar mensajes</p>
                </div>
              </div>
            )}
          </div>
        </>
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