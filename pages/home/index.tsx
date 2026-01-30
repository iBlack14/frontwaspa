import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Sidebar from '../../components/dashboard/index';
import { toast } from 'sonner';
import StatsCards from '../../components/dashboard/StatsCards';
import RealTimeMetrics from '../../components/dashboard/RealTimeMetrics';
import AdvancedChart from '../../components/dashboard/AdvancedChart';
import AnimatedBackground from '../../components/dashboard/AnimatedBackground';
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
        borderColor: '#818cf8', // Indigo 400
        backgroundColor: 'rgba(129, 140, 248, 0.05)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: '#818cf8',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
      {
        label: 'API',
        data: (historyData || []).map((data) => data.api_message_sent),
        borderColor: '#c084fc', // Purple 400
        backgroundColor: 'rgba(192, 132, 252, 0.05)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: '#c084fc',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
      {
        label: 'Recibidos',
        data: (historyData || []).map((data) => data.message_received),
        borderColor: '#34d399', // Emerald 400
        backgroundColor: 'rgba(52, 211, 153, 0.05)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: '#34d399',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
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
        backgroundColor: 'rgba(15, 23, 42, 0.8)', // Slate 900 con opacidad
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        cornerRadius: 12,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        displayColors: true,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#64748b',
          font: { size: 11 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 7
        },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(226, 232, 240, 0.05)', // Cuadrícula casi invisible
          drawTicks: false,
        },
        ticks: {
          color: '#64748b',
          font: { size: 11 },
          maxTicksLimit: 5,
          padding: 10
        },
        border: { display: false },
      },
    },
  };

  const userName = session?.user?.user_metadata?.full_name ||
    session?.user?.email?.split('@')[0] ||
    'Usuario';

  return (
    <div className="relative p-6 space-y-8 bg-slate-50 dark:bg-transparent min-h-screen">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Content with relative positioning */}
      <div className="relative z-10">


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

            {/* Enhanced Stats Cards */}
            <StatsCards
              metrics={metrics}
              activeInstances={activeInstances}
              totalInstances={totalInstances}
              historyData={historyData}
            />

            {/* Enhanced Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Enhanced History Chart */}
              <div className="lg:col-span-2">
                <AdvancedChart
                  data={chartData}
                  options={chartOptions}
                  historyData={historyData}
                  metrics={metrics}
                />
              </div>

              {/* Enhanced System Stats */}
              <div className="space-y-6">
                {/* Real-Time Metrics */}
                <RealTimeMetrics
                  systemInfo={systemInfo}
                  cacheStats={cacheStats}
                  activeInstances={activeInstances}
                  totalInstances={totalInstances}
                />

                {/* Quick Stats Mini Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                        <CheckCircleIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tasa de Éxito</div>
                        <div className="text-lg font-bold text-slate-800 dark:text-white">98.5%</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                        <ClockIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tiempo Respuesta</div>
                        <div className="text-lg font-bold text-slate-800 dark:text-white">1.2s</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
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
