import { SessionProvider, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import Sidebar from '../components/dashboard/index';
import { toast, Toaster } from 'sonner';

interface UsageStats {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  avg_response_time_ms: number;
  most_used_endpoint: string;
  requests_by_day: Record<string, number>;
}

interface RecentCall {
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  timestamp: string;
}

function ApiUsageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchUsageStats();
    }
  }, [status, router, days]);

  const fetchUsageStats = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`/api/user/api-usage?days=${days}`);
      setStats(res.data.stats);
      setRecentCalls(res.data.recentCalls);
    } catch (error: any) {
      toast.error('Error al cargar estadísticas');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (code: number) => {
    if (code >= 200 && code < 300) return 'text-green-400';
    if (code >= 400 && code < 500) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-900/30 text-blue-400';
      case 'POST': return 'bg-green-900/30 text-green-400';
      case 'PUT': return 'bg-yellow-900/30 text-yellow-400';
      case 'DELETE': return 'bg-red-900/30 text-red-400';
      default: return 'bg-zinc-800 text-zinc-400';
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  const successRate = stats?.total_requests 
    ? ((stats.successful_requests / stats.total_requests) * 100).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Toaster richColors position="top-right" />

      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/settings/api-key"
                className="text-emerald-500 hover:text-emerald-400 transition"
              >
                ← API Key
              </Link>
              <h1 className="text-2xl font-bold">📊 Uso de API</h1>
            </div>
            
            {/* Period Selector */}
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm"
            >
              <option value={1}>Último día</option>
              <option value={7}>Últimos 7 días</option>
              <option value={30}>Últimos 30 días</option>
              <option value={90}>Últimos 90 días</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Requests */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-100 text-sm">Total Requests</span>
              <span className="text-3xl">📡</span>
            </div>
            <div className="text-white text-3xl font-bold">
              {stats?.total_requests?.toLocaleString() || 0}
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-100 text-sm">Tasa de Éxito</span>
              <span className="text-3xl">✅</span>
            </div>
            <div className="text-white text-3xl font-bold">
              {successRate}%
            </div>
            <div className="text-green-100 text-xs mt-1">
              {stats?.successful_requests || 0} exitosos
            </div>
          </div>

          {/* Failed Requests */}
          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-red-100 text-sm">Fallidos</span>
              <span className="text-3xl">❌</span>
            </div>
            <div className="text-white text-3xl font-bold">
              {stats?.failed_requests || 0}
            </div>
          </div>

          {/* Avg Response Time */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-100 text-sm">Tiempo Promedio</span>
              <span className="text-3xl">⚡</span>
            </div>
            <div className="text-white text-3xl font-bold">
              {stats?.avg_response_time_ms?.toFixed(0) || 0}ms
            </div>
          </div>
        </div>

        {/* Most Used Endpoint */}
        {stats?.most_used_endpoint && stats.most_used_endpoint !== 'N/A' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-bold mb-3">🎯 Endpoint Más Usado</h2>
            <div className="bg-zinc-950 border border-zinc-700 rounded-lg p-4">
              <code className="text-emerald-400 font-mono">
                {stats.most_used_endpoint}
              </code>
            </div>
          </div>
        )}

        {/* Requests by Day */}
        {stats?.requests_by_day && Object.keys(stats.requests_by_day).length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-bold mb-4">📈 Requests por Día</h2>
            <div className="space-y-2">
              {Object.entries(stats.requests_by_day)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([date, count]) => (
                  <div key={date} className="flex items-center gap-4">
                    <span className="text-zinc-400 text-sm w-32">
                      {new Date(date).toLocaleDateString('es-ES')}
                    </span>
                    <div className="flex-1 bg-zinc-950 rounded-full h-8 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-600 to-emerald-500 h-full flex items-center px-3 transition-all"
                        style={{
                          width: `${Math.min((count / (stats.total_requests || 1)) * 100, 100)}%`,
                        }}
                      >
                        <span className="text-white text-sm font-semibold">
                          {count}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Recent Calls */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-lg font-bold mb-4">🕐 Últimas 20 Llamadas</h2>
          
          {recentCalls.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              No hay llamadas registradas aún
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-3 px-4 text-sm text-zinc-400">Timestamp</th>
                    <th className="text-left py-3 px-4 text-sm text-zinc-400">Método</th>
                    <th className="text-left py-3 px-4 text-sm text-zinc-400">Endpoint</th>
                    <th className="text-left py-3 px-4 text-sm text-zinc-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm text-zinc-400">Tiempo</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCalls.map((call, index) => (
                    <tr key={index} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="py-3 px-4 text-sm text-zinc-400">
                        {new Date(call.timestamp).toLocaleString('es-ES')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded ${getMethodColor(call.method)}`}>
                          {call.method}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-sm text-emerald-400">{call.endpoint}</code>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-semibold ${getStatusColor(call.status_code)}`}>
                          {call.status_code}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-zinc-400">
                        {call.response_time_ms}ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ApiUsagePage() {
  return (
    <Sidebar>
      <ApiUsageContent />
    </Sidebar>
  );
}
