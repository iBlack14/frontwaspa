'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Sidebar from '../components/dashboard/index';
import { toast } from 'sonner';
import {
  ChevronDownIcon,
  ChatBubbleBottomCenterTextIcon,
  PaperAirplaneIcon,
  InboxArrowDownIcon,
  ServerIcon,
  CheckCircleIcon,
  XCircleIcon,
  CpuChipIcon,
  ClockIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import type { ChartOptions } from 'chart.js';

// ✅ Lazy load Chart.js
const LazyChart = lazy(() => import('@/components/ChartComponent'));

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
  const { session, status } = useAuth();
  const router = useRouter();
  const [instances, setInstances] = useState<WhatsAppSession[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Estado para estadísticas de cache
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [systemInfo, setSystemInfo] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchUserSessions();
      fetchCacheStats();
      const interval = setInterval(fetchCacheStats, 30000);
      return () => clearInterval(interval);
    }
  }, [status, router]);

  const fetchCacheStats = async () => {
    try {
      const res = await axios.get('/api/system/cache-stats');
      setCacheStats(res.data.cache);
      setSystemInfo(res.data.system);
    } catch (error) {
      console.log('Cache stats not available');
    }
  };

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
        documentId: item.document_id || item.documentId,
        webhook_url: item.webhook_url || null,
        state: item.state,
        is_active: item.is_active,
        historycal_data: item.historycal_data || [],
        name: item.profile_name || null,
        profilePicUrl: item.profile_pic_url || null,
        number: item.phone_number || null,
      }));

      const instancesWithoutData = fetchedSessions.filter(
        (instance) => !instance.historycal_data || instance.historycal_data.length === 0
      );

      if (instancesWithoutData.length > 0) {
        try {
          await axios.post('/api/instances/initialize-stats', {});
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

          if (updatedSessions.length > 0) {
            setSelectedInstanceId(updatedSessions[0].documentId);
            setHistoryData(updatedSessions[0].historycal_data || []);
          }
        } catch (initError) {
          console.error('Error initializing stats:', initError);
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

  const selectedInstance = instances.find((instance) => instance.documentId === selectedInstanceId);

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
        label: 'Enviados',
        data: (historyData || []).map((data) => data.message_sent),
        borderColor: '#6366f1', // Indigo 500
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
      },
      {
        label: 'API',
        data: (historyData || []).map((data) => data.api_message_sent),
        borderColor: '#a855f7', // Purple 500
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
      },
      {
        label: 'Recibidos',
        data: (historyData || []).map((data) => data.message_received),
        borderColor: '#10b981', // Emerald 500
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1e293b',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11 } },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: { color: '#94a3b8', font: { size: 11 }, maxTicksLimit: 5 },
        border: { display: false },
      },
    },
  };

  const userName = session?.user?.user_metadata?.full_name ||
    session?.user?.email?.split('@')[0] ||
    'Usuario';

  return (
    <div className="p-6 space-y-8 bg-slate-50 dark:bg-transparent min-h-screen">


      {loading ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : instances.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[400px] bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-full mb-4">
            <ServerIcon className="w-10 h-10 text-indigo-500" strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">No hay instancias</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Crea una nueva instancia para comenzar</p>
        </div>
      ) : (
        <>
          {/* Header & Instance Selector */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Dashboard</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Bienvenido de nuevo, {userName}</p>
            </div>

            {/* Delicate Instance Dropdown */}
            <div className="relative z-50" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 bg-white dark:bg-[#1e293b] px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 min-w-[240px]"
              >
                {selectedInstance?.profilePicUrl ? (
                  <img src={selectedInstance.profilePicUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                    {selectedInstance?.name?.[0] || 'I'}
                  </div>
                )}
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[120px]">
                    {selectedInstance?.name || 'Instancia'}
                  </p>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedInstance?.state === 'Connected' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                    {selectedInstance?.state}
                  </p>
                </div>
                <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden py-2">
                  {instances.map((inst) => (
                    <div
                      key={inst.documentId}
                      onClick={() => handleInstanceSelect(inst.documentId)}
                      className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${inst.documentId === selectedInstanceId
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-2 border-indigo-500'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-l-2 border-transparent'
                        }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${inst.state === 'Connected' ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1 truncate">
                        {inst.name || inst.documentId}
                      </span>
                      {inst.documentId === selectedInstanceId && <CheckCircleIcon className="w-4 h-4 text-indigo-500" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Metrics Grid - Pastel & Delicate */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Instances */}
            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-3xl border border-blue-100 dark:border-blue-800/30 transition-transform hover:-translate-y-1 duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
                  <ServerIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                </div>
                <span className="bg-white dark:bg-blue-900/30 px-2 py-1 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-300 shadow-sm">
                  Total
                </span>
              </div>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">{totalInstances}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Instancias activas: <span className="font-semibold text-blue-600">{activeInstances}</span></p>
            </div>

            {/* Sent Messages */}
            <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-800/30 transition-transform hover:-translate-y-1 duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl">
                  <PaperAirplaneIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} />
                </div>
                <span className="bg-white dark:bg-indigo-900/30 px-2 py-1 rounded-lg text-xs font-medium text-indigo-600 dark:text-indigo-300 shadow-sm">
                  Enviados
                </span>
              </div>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">{metrics.totalSent.toLocaleString()}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total acumulado</p>
            </div>

            {/* API Messages */}
            <div className="bg-purple-50/50 dark:bg-purple-900/10 p-6 rounded-3xl border border-purple-100 dark:border-purple-800/30 transition-transform hover:-translate-y-1 duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl">
                  <ChatBubbleBottomCenterTextIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" strokeWidth={1.5} />
                </div>
                <span className="bg-white dark:bg-purple-900/30 px-2 py-1 rounded-lg text-xs font-medium text-purple-600 dark:text-purple-300 shadow-sm">
                  API
                </span>
              </div>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">{metrics.totalApiSent.toLocaleString()}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Automatizados</p>
            </div>

            {/* Received Messages */}
            <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-800/30 transition-transform hover:-translate-y-1 duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl">
                  <InboxArrowDownIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
                </div>
                <span className="bg-white dark:bg-emerald-900/30 px-2 py-1 rounded-lg text-xs font-medium text-emerald-600 dark:text-emerald-300 shadow-sm">
                  Recibidos
                </span>
              </div>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">{metrics.totalReceived.toLocaleString()}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total entrantes</p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* History Chart - Floating Container */}
            <div className="lg:col-span-2 bg-white dark:bg-[#1e293b] rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Actividad Reciente</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Rendimiento de los últimos 30 días</p>
                </div>
                <div className="flex gap-2">
                  <span className="flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div> Enviados
                  </span>
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Recibidos
                  </span>
                </div>
              </div>

              <div className="h-[350px] w-full">
                {historyData.length > 0 ? (
                  <Suspense fallback={<div className="h-full w-full flex items-center justify-center bg-slate-50 rounded-2xl"><div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500"></div></div>}>
                    <LazyChart data={chartData} options={chartOptions} />
                  </Suspense>
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <ChatBubbleBottomCenterTextIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-slate-400 dark:text-slate-500 text-sm">No hay datos suficientes</p>
                  </div>
                )}
              </div>
            </div>

            {/* System Stats - Compact Vertical Stack */}
            <div className="space-y-6">
              {/* System Info Card */}
              <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <CpuChipIcon className="w-5 h-5 text-slate-400" />
                  Estado del Sistema
                </h3>

                <div className="space-y-4">
                  {/* Memory */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">Memoria</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {systemInfo ? `${((systemInfo.memoryUsage.heapUsed / systemInfo.memoryUsage.heapTotal) * 100).toFixed(0)}%` : '0%'}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: systemInfo ? `${(systemInfo.memoryUsage.heapUsed / systemInfo.memoryUsage.heapTotal) * 100}%` : '0%' }}
                      ></div>
                    </div>
                  </div>

                  {/* Cache */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">Cache</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {cacheStats ? cacheStats.usage : '0%'}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: cacheStats ? cacheStats.usage : '0%' }}
                      ></div>
                    </div>
                  </div>

                  {/* Uptime */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-500">Uptime</span>
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {systemInfo ? `${Math.floor(systemInfo.uptime / 3600)}h ${Math.floor((systemInfo.uptime % 3600) / 60)}m` : '--'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions / Info */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <BoltIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Estado Global</h3>
                    <p className="text-indigo-100 text-xs">Actualizado en tiempo real</p>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                  <span className="text-sm font-medium text-indigo-50">Conexiones</span>
                  <span className="text-xl font-bold">{activeInstances}/{totalInstances}</span>
                </div>
              </div>
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