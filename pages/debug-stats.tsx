import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';

interface InstanceData {
  name: string;
  documentId: string;
  state: string;
  hasData: boolean;
  dataCount: number;
  data: any;
}

interface DebugData {
  totalInstances: number;
  instances: InstanceData[];
}

export default function DebugStats() {
  const { session } = useAuth();
  const [data, setData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/debug/check-stats');
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <p className="text-white">Por favor inicia sesión</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-white">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6">
          <p className="text-red-200">❌ Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">
            🔍 Debug: Datos en Supabase
          </h1>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            🔄 Recargar
          </button>
        </div>

        {data && (
          <>
            <div className="bg-zinc-800 rounded-lg p-6 mb-6 border border-zinc-700">
              <h2 className="text-xl font-bold text-white mb-4">📊 Resumen</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-zinc-400 text-sm">Total Instancias</p>
                  <p className="text-white text-2xl font-bold">{data.totalInstances}</p>
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">Con Datos Históricos</p>
                  <p className="text-white text-2xl font-bold">
                    {data.instances.filter(i => i.hasData).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {data.instances.map((instance, index) => (
                <div
                  key={index}
                  className={`rounded-lg p-6 border ${instance.hasData
                      ? 'bg-emerald-900/20 border-emerald-500'
                      : 'bg-zinc-800 border-zinc-700'
                    }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-white font-bold text-lg mb-1">
                        {instance.name}
                      </h3>
                      <p className="text-zinc-400 text-sm font-mono">
                        {instance.documentId}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${instance.state === 'Connected'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                          }`}
                      >
                        {instance.state}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${instance.hasData
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-zinc-700 text-zinc-400'
                          }`}
                      >
                        {instance.hasData ? '✅ Con Datos' : '❌ Sin Datos'}
                      </span>
                    </div>
                  </div>

                  {instance.hasData ? (
                    <div>
                      <p className="text-zinc-400 text-sm mb-3">
                        📊 Total de días registrados: <span className="text-white font-bold">{instance.dataCount}</span>
                      </p>
                      <div className="bg-zinc-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                        <pre className="text-emerald-400 text-xs font-mono">
                          {JSON.stringify(instance.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-zinc-900 rounded-lg p-6 text-center">
                      <p className="text-zinc-500">
                        No hay datos históricos para esta instancia
                      </p>
                      <p className="text-zinc-600 text-sm mt-2">
                        historycal_data está vacío o null
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-8 bg-blue-900/20 border border-blue-500 rounded-lg p-6">
          <h3 className="text-blue-400 font-bold mb-2">💡 Información</h3>
          <ul className="text-blue-200 text-sm space-y-1">
            <li>• Esta página muestra los datos RAW directamente de Supabase</li>
            <li>• Si no ves datos, el campo <code>historycal_data</code> está vacío</li>
            <li>• Usa el botón "🧪 Generar Datos de Prueba" en Home para crear datos</li>
            <li>• O configura el tracking en tiempo real para datos reales</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
