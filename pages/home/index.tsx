'use client';
import { SessionProvider, useSession } from 'next-auth/react';
import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
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
const LazyChart = lazy(() => import('@/components/ChartComponent'));

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
    labels: (historyData || []).map((data) => {
      const date = new Date(data.date);
      return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Mensajes Enviados',
        data: (historyData || []).map((data) => data.message_sent),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(16, 185, 129)',
      },
      {
        label: 'Mensajes API',
        data: (historyData || []).map((data) => data.api_message_sent),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: 'rgb(168, 85, 247)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(168, 85, 247)',
      },
      {
        label: 'Mensajes Recibidos',
        data: (historyData || []).map((data) => data.message_received),
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: 'rgb(249, 115, 22)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(249, 115, 22)',
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2.5,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(24, 24, 27, 0.95)',
        titleColor: '#fff',
        bodyColor: '#a1a1aa',
        borderColor: 'rgba(63, 63, 70, 0.5)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        boxWidth: 8,
        boxHeight: 8,
        usePointStyle: true,
        callbacks: {
          label: (context: any) => {
            const datasetLabel = context.dataset.label || '';
            const value = context.parsed.y;
            return ` ${datasetLabel}: ${value} mensajes`;
          },
        },
      },
      datalabels: {
        display: (context: any) => {
          const value = context.dataset.data[context.dataIndex];
          return value > 0;
        },
        align: 'top' as const,
        offset: 8,
        formatter: (value: number) => value > 0 ? value : '',
        color: '#fff',
        font: {
          weight: 'bold' as const,
          size: 11,
        },
        backgroundColor: 'rgba(24, 24, 27, 0.8)',
        borderRadius: 4,
        padding: {
          top: 4,
          bottom: 4,
          left: 6,
          right: 6,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: 'rgba(63, 63, 70, 0.3)',
        },
        ticks: {
          color: '#a1a1aa',
          font: {
            size: 11,
          },
          padding: 8,
        },
        border: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(63, 63, 70, 0.3)',
        },
        ticks: {
          color: '#a1a1aa',
          font: {
            size: 11,
          },
          padding: 8,
          stepSize: 5,
        },
        border: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-transparent min-h-screen">
      <Toaster richColors position="top-right" />
      
      {loading ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-zinc-400 text-lg">Cargando instancias...</p>
          </div>
        </div>
      ) : instances.length === 0 ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center bg-white dark:bg-zinc-800/50 p-12 rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-lg dark:shadow-none">
            <ServerIcon className="w-20 h-20 mx-auto text-gray-400 dark:text-zinc-600 mb-4" />
            <p className="text-gray-800 dark:text-zinc-300 text-xl mb-2">No tienes instancias disponibles</p>
            <p className="text-gray-500 dark:text-zinc-500">Crea una nueva instancia para comenzar</p>
          </div>
        </div>
      ) : (
        <>
          {/* Header with metrics cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Instances Card */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl p-6 shadow-lg dark:shadow-xl transform transition-transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-50 dark:text-blue-100 text-sm font-medium mb-1">Total Instancias</p>
                  <p className="text-white text-3xl font-bold">{totalInstances}</p>
                  <p className="text-blue-100 dark:text-blue-200 text-xs mt-1">{activeInstances} activas</p>
                </div>
                <ServerIcon className="w-12 h-12 text-blue-100 dark:text-blue-200 opacity-80" />
              </div>
            </div>

            {/* Messages Sent Card */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 rounded-xl p-6 shadow-lg dark:shadow-xl transform transition-transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-50 dark:text-emerald-100 text-sm font-medium mb-1">Mensajes Enviados</p>
                  <p className="text-white text-3xl font-bold">{metrics.totalSent.toLocaleString()}</p>
                  <p className="text-emerald-100 dark:text-emerald-200 text-xs mt-1">Total acumulado</p>
                </div>
                <PaperAirplaneIcon className="w-12 h-12 text-emerald-100 dark:text-emerald-200 opacity-80" />
              </div>
            </div>

            {/* API Messages Card */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-xl p-6 shadow-lg dark:shadow-xl transform transition-transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-50 dark:text-purple-100 text-sm font-medium mb-1">Mensajes API</p>
                  <p className="text-white text-3xl font-bold">{metrics.totalApiSent.toLocaleString()}</p>
                  <p className="text-purple-100 dark:text-purple-200 text-xs mt-1">Vía API</p>
                </div>
                <ChatBubbleBottomCenterTextIcon className="w-12 h-12 text-purple-100 dark:text-purple-200 opacity-80" />
              </div>
            </div>

            {/* Messages Received Card */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 rounded-xl p-6 shadow-lg dark:shadow-xl transform transition-transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-50 dark:text-orange-100 text-sm font-medium mb-1">Mensajes Recibidos</p>
                  <p className="text-white text-3xl font-bold">{metrics.totalReceived.toLocaleString()}</p>
                  <p className="text-orange-100 dark:text-orange-200 text-xs mt-1">Total recibidos</p>
                </div>
                <InboxArrowDownIcon className="w-12 h-12 text-orange-100 dark:text-orange-200 opacity-80" />
              </div>
            </div>
          </div>

          {/* Instance Selector with Profile - MEJORADO */}
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-zinc-800 dark:to-zinc-900 rounded-2xl p-6 border border-gray-200 dark:border-zinc-700 shadow-xl dark:shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-lg rounded-full"></div>
                  <div className="relative bg-gradient-to-br from-emerald-500 to-emerald-600 p-2.5 rounded-xl shadow-lg">
                    <ServerIcon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <h2 className="text-gray-900 dark:text-white text-xl font-bold">
                  Instancia Activa
                </h2>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-emerald-700 dark:text-emerald-400 text-sm font-semibold">
                  {activeInstances}/{totalInstances} conectadas
                </span>
              </div>
            </div>

            <div className="relative" ref={dropdownRef}>
              {/* Enhanced Dropdown Trigger */}
              <div
                className="flex items-center justify-between p-5 bg-white dark:bg-zinc-900 border-2 border-gray-200 dark:border-zinc-700 rounded-2xl cursor-pointer hover:border-emerald-500 hover:shadow-lg transition-all duration-300 group"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {selectedInstance?.profilePicUrl ? (
                      <>
                        <div className="absolute inset-0 bg-emerald-500/30 blur-md rounded-full"></div>
                        <img
                          src={selectedInstance.profilePicUrl}
                          alt="Profile"
                          className="relative w-16 h-16 rounded-full object-cover border-4 border-emerald-500 shadow-xl ring-2 ring-emerald-500/20"
                          onError={(e) => (e.currentTarget.src = '/logo/profile.png')}
                        />
                      </>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center border-4 border-gray-300 dark:border-zinc-600 shadow-lg">
                        <ServerIcon className="w-8 h-8 text-gray-500 dark:text-zinc-400" />
                      </div>
                    )}
                    {selectedInstance && (
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-3 border-white dark:border-zinc-900 ${
                        selectedInstance.state === 'Connected' ? 'bg-emerald-500' : 'bg-red-500'
                      } shadow-lg`}></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 dark:text-white font-bold text-xl mb-1">
                      {selectedInstance?.name || 'Sin nombre'}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      {selectedInstance?.number && (
                        <span className="text-gray-600 dark:text-zinc-400 text-sm font-medium flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                          {selectedInstance.number}
                        </span>
                      )}
                      {selectedInstance && (
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
                          selectedInstance.state === 'Connected'
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                        }`}>
                          {selectedInstance.state === 'Connected' ? (
                            <CheckCircleIcon className="w-4 h-4" />
                          ) : (
                            <XCircleIcon className="w-4 h-4" />
                          )}
                          {selectedInstance.state}
                        </span>
                      )}
                    </div>
                    {selectedInstance?.documentId && (
                      <p className="text-gray-500 dark:text-zinc-500 text-xs mt-1 font-mono">
                        ID: {selectedInstance.documentId}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden sm:block text-right mr-2">
                    <p className="text-xs text-gray-500 dark:text-zinc-500 font-medium">Cambiar</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-600">instancia</p>
                  </div>
                  <ChevronDownIcon
                    className={`w-7 h-7 text-gray-400 dark:text-zinc-500 group-hover:text-emerald-500 transition-all duration-300 ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Enhanced Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute z-10 mt-2 w-full bg-white dark:bg-zinc-900 border-2 border-gray-200 dark:border-zinc-700 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
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
          <div className="relative overflow-hidden bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-zinc-900 dark:via-zinc-900 dark:to-black rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-xl dark:shadow-2xl">
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
            
            <div className="relative z-10 p-8">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full"></div>
                    <div className="relative bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-2xl shadow-lg">
                      <ChatBubbleBottomCenterTextIcon className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-gray-900 dark:text-white text-2xl font-bold tracking-tight">Historial de Mensajes</h2>
                    <p className="text-gray-600 dark:text-zinc-400 text-sm mt-1">Estadísticas de los últimos 30 días</p>
                  </div>
                </div>
                
                {historyData.length > 0 && (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl backdrop-blur-sm">
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50"></div>
                      <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Enviados</span>
                    </div>
                    <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/20 px-4 py-2.5 rounded-xl backdrop-blur-sm">
                      <div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-pulse shadow-lg shadow-purple-500/50"></div>
                      <span className="text-purple-600 dark:text-purple-400 text-sm font-medium">API</span>
                    </div>
                    <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 px-4 py-2.5 rounded-xl backdrop-blur-sm">
                      <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse shadow-lg shadow-orange-500/50"></div>
                      <span className="text-orange-600 dark:text-orange-400 text-sm font-medium">Recibidos</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chart Container */}
              {historyData.length > 0 ? (
                <div className="relative bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-zinc-800/50">
                  {/* Grid pattern overlay */}
                  <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }}></div>
                  
                  <div className="relative z-10">
                    <Suspense
                      fallback={
                        <div className="flex items-center justify-center h-[500px]">
                          <div className="text-center">
                            <div className="relative">
                              <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full"></div>
                              <div className="relative animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-500 mx-auto mb-4"></div>
                            </div>
                            <div className="text-gray-600 dark:text-zinc-400 font-medium">Cargando estadísticas...</div>
                          </div>
                        </div>
                      }
                    >
                      <LazyChart data={chartData} options={chartOptions} />
                    </Suspense>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[450px] bg-gray-100/50 dark:bg-black/20 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-300 dark:border-zinc-800/50">
                  <div className="text-center max-w-md">
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-gray-300/20 dark:bg-zinc-700/20 blur-3xl rounded-full"></div>
                      <div className="relative bg-gray-200/50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-gray-300 dark:border-zinc-700/50">
                        <ChatBubbleBottomCenterTextIcon className="w-20 h-20 text-gray-400 dark:text-zinc-600" />
                      </div>
                    </div>
                    <h3 className="text-gray-800 dark:text-zinc-300 text-xl font-semibold mb-2">No hay datos históricos</h3>
                    <p className="text-gray-600 dark:text-zinc-500 text-sm leading-relaxed">
                      Las estadísticas aparecerán automáticamente cuando comiences a enviar y recibir mensajes
                    </p>
                  </div>
                </div>
              )}
            </div>
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

// Forzar SSR para evitar errores de pre-renderizado durante el build
export async function getServerSideProps() {
  return {
    props: {},
  };
}