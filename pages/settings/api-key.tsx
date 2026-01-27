import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import axios from 'axios';
import Sidebar from '../../components/dashboard/index';
import { toast } from 'sonner';

interface ApiKeyData {
  apiKey: string;
  createdAt: string;
  history: Array<{
    old_api_key: string;
    new_api_key: string;
    reason: string;
    revoked_at: string;
  }>;
}

function ApiKeyContent() {
  const { session, status } = useAuth();
  const router = useRouter();
  const [apiKeyData, setApiKeyData] = useState<ApiKeyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchApiKey();
    }
  }, [status, router]);

  const fetchApiKey = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get('/api/user/api-key');
      setApiKeyData(res.data);
    } catch (error: any) {
      toast.error('Error al cargar API key');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (apiKeyData?.apiKey) {
      navigator.clipboard.writeText(apiKeyData.apiKey);
      setCopied(true);
      toast.success('API key copiada al portapapeles');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const regenerateApiKey = async () => {
    if (!confirm('¿Estás seguro? La API key anterior dejará de funcionar inmediatamente.')) {
      return;
    }

    try {
      setIsRegenerating(true);
      const res = await axios.post('/api/user/api-key', {
        reason: 'User requested regeneration from settings',
      });

      toast.success('API key regenerada exitosamente');

      // Actualizar con la nueva key
      setApiKeyData({
        ...apiKeyData!,
        apiKey: res.data.newApiKey,
      });

      // Recargar historial
      fetchApiKey();
    } catch (error: any) {
      toast.error('Error al regenerar API key');
      console.error(error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const maskApiKey = (key: string) => {
    if (!key) return '';
    return key.substring(0, 12) + '•'.repeat(20) + key.substring(key.length - 8);
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
                href="/settings"
                className="text-emerald-500 hover:text-emerald-400 transition"
              >
                ← Configuración
              </Link>
              <h1 className="text-2xl font-bold">🔑 API Key</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* API Key Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Tu API Key</h2>
            <span className="text-xs text-zinc-500">
              Creada: {apiKeyData?.createdAt ? new Date(apiKeyData.createdAt).toLocaleDateString('es-ES') : 'N/A'}
            </span>
          </div>

          {/* API Key Display */}
          <div className="bg-zinc-950 border border-zinc-700 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <code className="text-emerald-400 font-mono text-sm flex-1">
                {showKey ? apiKeyData?.apiKey : maskApiKey(apiKeyData?.apiKey || '')}
              </code>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md text-sm transition"
                >
                  {showKey ? '👁️ Ocultar' : '👁️ Mostrar'}
                </button>
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-md text-sm transition"
                >
                  {copied ? '✅ Copiado' : '📋 Copiar'}
                </button>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <span className="text-yellow-400 text-xl">⚠️</span>
              <div className="flex-1">
                <h3 className="text-yellow-400 font-semibold mb-1">Mantén tu API key segura</h3>
                <p className="text-zinc-400 text-sm">
                  No compartas tu API key con nadie. Si crees que ha sido comprometida, regenerala inmediatamente.
                </p>
              </div>
            </div>
          </div>

          {/* Regenerate Button */}
          <button
            onClick={regenerateApiKey}
            disabled={isRegenerating}
            className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-900 disabled:cursor-not-allowed rounded-md font-semibold transition"
          >
            {isRegenerating ? '🔄 Regenerando...' : '🔄 Regenerar API Key'}
          </button>
        </div>

        {/* Usage Instructions */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">📖 Cómo usar tu API Key</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-emerald-400 font-semibold mb-2">1. Agregar en el Header</h3>
              <div className="bg-zinc-950 border border-zinc-700 rounded-lg p-4">
                <code className="text-sm text-zinc-300">
                  Authorization: Bearer {maskApiKey(apiKeyData?.apiKey || 'tu_api_key')}
                </code>
              </div>
            </div>

            <div>
              <h3 className="text-emerald-400 font-semibold mb-2">2. Ejemplo con cURL</h3>
              <div className="bg-zinc-950 border border-zinc-700 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-zinc-300">
                  {`curl https://backend.com/api/send-message \\
  -H "Authorization: Bearer ${maskApiKey(apiKeyData?.apiKey || 'tu_api_key')}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "clientId": "instance_id",
    "to": "1234567890",
    "message": "Hola!"
  }'`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-emerald-400 font-semibold mb-2">3. Ejemplo con JavaScript</h3>
              <div className="bg-zinc-950 border border-zinc-700 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-zinc-300">
                  {`const response = await fetch('https://backend.com/api/send-message', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${maskApiKey(apiKeyData?.apiKey || 'tu_api_key')}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    clientId: 'instance_id',
    to: '1234567890',
    message: 'Hola!'
  })
});`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* History */}
        {apiKeyData?.history && apiKeyData.history.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">📜 Historial de Rotación</h2>

            <div className="space-y-3">
              {apiKeyData.history.map((item, index) => (
                <div key={index} className="bg-zinc-950 border border-zinc-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-400">
                      {new Date(item.revoked_at).toLocaleString('es-ES')}
                    </span>
                    <span className="text-xs px-2 py-1 bg-zinc-800 rounded">
                      {item.reason}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 font-mono">
                    Anterior: {maskApiKey(item.old_api_key)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Link to Usage Stats */}
        <div className="mt-6">
          <Link
            href="/settings/api-usage"
            className="block w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold text-center transition"
          >
            📊 Ver Estadísticas de Uso
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ApiKeyPage() {
  return (
    <Sidebar>
      <ApiKeyContent />
    </Sidebar>
  );
}


// Force SSR to avoid static generation errors
export async function getServerSideProps() {
  return { props: {} };
}
