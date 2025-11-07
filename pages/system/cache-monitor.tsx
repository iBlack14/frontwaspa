import { SessionProvider, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import Sidebard from '../components/dashboard/index';

interface CacheStats {
  size: number;
  maxSize: number;
  usage: string;
  oldestEntry?: string;
}

interface SystemInfo {
  nodeVersion: string;
  platform: string;
  uptime: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  timestamp: string;
}

function CacheMonitorContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchStats();
      // Actualizar cada 10 segundos
      const interval = setInterval(fetchStats, 10000);
      return () => clearInterval(interval);
    }
  }, [status]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get('/api/system/cache-stats');
      setStats(res.data.cache);
      setSystemInfo(res.data.system);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar estadísticas');
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-emerald-500 hover:text-emerald-400 transition"
              >
                ← Volver
              </Link>
              <h1 className="text-2xl font-bold">📊 Monitor de Cache</h1>
            </div>
            <button
              onClick={fetchStats}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition text-sm"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-600 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Cache Stats */}
        {stats && (
          <div className="mb-8 bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">💾 Estadísticas del Cache LRU</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-zinc-800 rounded-lg p-4">
                <div className="text-zinc-400 text-sm mb-1">Tamaño Actual</div>
                <div className="text-3xl font-bold text-emerald-400">
                  {stats.size}
                </div>
                <div className="text-zinc-500 text-sm mt-1">spams activos</div>
              </div>

              <div className="bg-zinc-800 rounded-lg p-4">
                <div className="text-zinc-400 text-sm mb-1">Límite Máximo</div>
                <div className="text-3xl font-bold text-blue-400">
                  {stats.maxSize}
                </div>
                <div className="text-zinc-500 text-sm mt-1">spams máximo</div>
              </div>

              <div className="bg-zinc-800 rounded-lg p-4">
                <div className="text-zinc-400 text-sm mb-1">Uso del Cache</div>
                <div className="text-3xl font-bold text-yellow-400">
                  {stats.usage}
                </div>
                <div className="text-zinc-500 text-sm mt-1">capacidad utilizada</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-400">Capacidad del Cache</span>
                <span className="text-zinc-400">{stats.size} / {stats.maxSize}</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all ${
                    parseFloat(stats.usage) > 80
                      ? 'bg-red-500'
                      : parseFloat(stats.usage) > 50
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: stats.usage }}
                />
              </div>
            </div>

            {stats.oldestEntry && (
              <div className="mt-4 p-3 bg-zinc-800/50 rounded border border-zinc-700">
                <span className="text-zinc-400 text-sm">Entrada más antigua: </span>
                <span className="text-white font-mono text-sm">{stats.oldestEntry}</span>
              </div>
            )}
          </div>
        )}

        {/* System Info */}
        {systemInfo && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">🖥️ Información del Sistema</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="text-zinc-400 text-sm">Node.js Version</div>
                  <div className="text-lg font-semibold">{systemInfo.nodeVersion}</div>
                </div>
                <div>
                  <div className="text-zinc-400 text-sm">Plataforma</div>
                  <div className="text-lg font-semibold">{systemInfo.platform}</div>
                </div>
                <div>
                  <div className="text-zinc-400 text-sm">Tiempo Activo</div>
                  <div className="text-lg font-semibold">{formatUptime(systemInfo.uptime)}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-zinc-400 text-sm mb-2">Uso de Memoria</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>RSS:</span>
                      <span className="font-semibold">{formatBytes(systemInfo.memoryUsage.rss)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Heap Total:</span>
                      <span className="font-semibold">{formatBytes(systemInfo.memoryUsage.heapTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Heap Used:</span>
                      <span className="font-semibold text-yellow-400">
                        {formatBytes(systemInfo.memoryUsage.heapUsed)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>External:</span>
                      <span className="font-semibold">{formatBytes(systemInfo.memoryUsage.external)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800">
              <div className="text-zinc-400 text-sm">
                Última actualización: {new Date(systemInfo.timestamp).toLocaleString('es-ES')}
              </div>
            </div>
          </div>
        )}

        {/* Info Panel */}
        <div className="mt-8 bg-blue-900/20 border border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-3">ℹ️ Información del Sistema LRU</h3>
          <div className="space-y-2 text-sm text-zinc-300">
            <p>• <strong>LRU (Least Recently Used):</strong> Elimina automáticamente los elementos menos usados cuando se alcanza el límite.</p>
            <p>• <strong>TTL (Time To Live):</strong> Los spams expiran automáticamente después de 1 hora.</p>
            <p>• <strong>Límite:</strong> Máximo 100 spams en memoria simultáneamente.</p>
            <p>• <strong>Limpieza automática:</strong> Se ejecuta cada hora para eliminar elementos expirados.</p>
            <p>• <strong>Persistencia:</strong> Los datos se guardan en Supabase para recuperación.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CacheMonitor() {
  return (
    <Sidebard>
      <CacheMonitorContent />
    </Sidebard>
  );
}
