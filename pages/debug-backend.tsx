import { useEffect, useState } from 'react';
import axios from 'axios';

interface DiagnosticTest {
  status: 'OK' | 'FAIL';
  message: string;
  [key: string]: any;
}

interface Diagnostics {
  timestamp: string;
  environment: Record<string, any>;
  tests: Record<string, DiagnosticTest>;
  summary: {
    status: string;
    message: string;
  };
}

export default function DebugBackendPage() {
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/diagnostics');
      setDiagnostics(response.data);
    } catch (err: any) {
      setError(err.message || 'Error al ejecutar diagnóstico');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Ejecutando diagnóstico...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Backend Diagnostics</h1>
          <button
            onClick={runDiagnostics}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            Recargar
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
            Error: {error}
          </div>
        )}

        {diagnostics && (
          <>
            {/* Summary */}
            <div className={`rounded-lg p-6 mb-6 ${
              diagnostics.summary.status === 'HEALTHY'
                ? 'bg-green-900/30 border border-green-500'
                : 'bg-red-900/30 border border-red-500'
            }`}>
              <h2 className={`text-xl font-bold ${
                diagnostics.summary.status === 'HEALTHY' ? 'text-green-300' : 'text-red-300'
              }`}>
                {diagnostics.summary.status}
              </h2>
              <p className="text-gray-300 mt-2">{diagnostics.summary.message}</p>
              <p className="text-sm text-gray-400 mt-2">{diagnostics.timestamp}</p>
            </div>

            {/* Environment */}
            <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-4">Configuración</h3>
              <div className="space-y-2">
                {Object.entries(diagnostics.environment).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-start text-sm">
                    <span className="text-gray-400">{key}:</span>
                    <span className="text-gray-200 font-mono">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tests */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Tests</h3>
              {Object.entries(diagnostics.tests).map(([testName, testResult]) => (
                <div
                  key={testName}
                  className={`rounded-lg p-4 border ${
                    testResult.status === 'OK'
                      ? 'bg-green-900/20 border-green-500/50'
                      : 'bg-red-900/20 border-red-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-white capitalize">
                        {testName.replace(/([A-Z])/g, ' $1')}
                      </h4>
                      <p className={`text-sm mt-1 ${
                        testResult.status === 'OK' ? 'text-green-300' : 'text-red-300'
                      }`}>
                        {testResult.message}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      testResult.status === 'OK'
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}>
                      {testResult.status}
                    </span>
                  </div>

                  {/* Additional details */}
                  {Object.entries(testResult).map(([key, value]) => {
                    if (key === 'status' || key === 'message') return null;
                    return (
                      <div key={key} className="mt-3 text-xs text-gray-400">
                        <span className="block">{key}:</span>
                        <code className="block bg-slate-900 p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(value, null, 2)}
                        </code>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
