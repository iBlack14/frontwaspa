'use client';
import { SessionProvider, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast, Toaster } from 'sonner';
import Sidebard from '../components/dashboard/index';
import { ShieldCheckIcon, GlobeAltIcon, ArrowPathIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface ProxyConfig {
  proxy_enabled: boolean;
  proxy_type: 'http' | 'https' | 'socks4' | 'socks5';
  proxy_host: string;
  proxy_port: number | null;
  proxy_username: string;
  proxy_password: string;
  proxy_country: string;
  proxy_rotation: boolean;
  proxy_rotation_minutes: number;
}

function ProxySettingsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [config, setConfig] = useState<ProxyConfig>({
    proxy_enabled: false,
    proxy_type: 'http',
    proxy_host: '',
    proxy_port: null,
    proxy_username: '',
    proxy_password: '',
    proxy_country: '',
    proxy_rotation: false,
    proxy_rotation_minutes: 30,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadProxyConfig();
    }
  }, [status, router]);

  const loadProxyConfig = async () => {
    try {
      const res = await axios.get('/api/settings/proxy');
      if (res.data.success) {
        setConfig({
          proxy_enabled: res.data.config.proxy_enabled || false,
          proxy_type: res.data.config.proxy_type || 'http',
          proxy_host: res.data.config.proxy_host || '',
          proxy_port: res.data.config.proxy_port || null,
          proxy_username: res.data.config.proxy_username || '',
          proxy_password: '', // No cargar password por seguridad
          proxy_country: res.data.config.proxy_country || '',
          proxy_rotation: res.data.config.proxy_rotation || false,
          proxy_rotation_minutes: res.data.config.proxy_rotation_minutes || 30,
        });
      }
    } catch (error: any) {
      console.error('Error cargando configuración:', error);
      toast.error('Error al cargar configuración de proxy');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validaciones
    if (config.proxy_enabled) {
      if (!config.proxy_host.trim()) {
        toast.error('El host del proxy es requerido');
        return;
      }
      if (!config.proxy_port || config.proxy_port < 1 || config.proxy_port > 65535) {
        toast.error('El puerto debe estar entre 1 y 65535');
        return;
      }
    }

    setSaving(true);
    try {
      const res = await axios.put('/api/settings/proxy', config);
      if (res.data.success) {
        toast.success('Configuración guardada exitosamente');
        setTestResult(null); // Reset test result
      }
    } catch (error: any) {
      console.error('Error guardando:', error);
      toast.error(error.response?.data?.error || 'Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!config.proxy_host.trim() || !config.proxy_port) {
      toast.error('Configura host y puerto antes de probar');
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const res = await axios.post('/api/settings/proxy/test', config);
      if (res.data.success) {
        setTestResult({
          success: true,
          message: `✅ Proxy funcional! IP: ${res.data.ip} | Ubicación: ${res.data.location}`,
        });
        toast.success('Proxy funciona correctamente');
      }
    } catch (error: any) {
      console.error('Error probando proxy:', error);
      const errorMsg = error.response?.data?.error || 'No se pudo conectar al proxy';
      setTestResult({
        success: false,
        message: `❌ Error: ${errorMsg}`,
      });
      toast.error('El proxy no funciona correctamente');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-900 dark:text-white">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Toaster richColors position="top-right" />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheckIcon className="w-8 h-8 text-emerald-500" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Configuración de Proxy
          </h1>
        </div>
        <p className="text-gray-600 dark:text-zinc-400">
          Configura un proxy para proteger tu IP y evitar bloqueos de WhatsApp
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
          💡 ¿Por qué usar un proxy?
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>• Oculta tu IP real al enviar mensajes masivos</li>
          <li>• Reduce riesgo de baneo por actividad sospechosa</li>
          <li>• Permite enviar desde diferentes ubicaciones geográficas</li>
          <li>• Rotación automática para máxima seguridad</li>
        </ul>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-800 p-6 space-y-6">
        
        {/* Enable Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
          <div className="flex items-center gap-3">
            <GlobeAltIcon className="w-6 h-6 text-gray-500 dark:text-zinc-400" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Habilitar Proxy
              </h3>
              <p className="text-sm text-gray-600 dark:text-zinc-400">
                Activar uso de proxy para envíos
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.proxy_enabled}
              onChange={(e) => setConfig({ ...config, proxy_enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* Proxy Type */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Tipo de Proxy
          </label>
          <select
            value={config.proxy_type}
            onChange={(e) => setConfig({ ...config, proxy_type: e.target.value as any })}
            disabled={!config.proxy_enabled}
            className="w-full p-3 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="http">HTTP</option>
            <option value="https">HTTPS</option>
            <option value="socks4">SOCKS4</option>
            <option value="socks5">SOCKS5</option>
          </select>
        </div>

        {/* Host & Port */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Host / IP del Proxy *
            </label>
            <input
              type="text"
              value={config.proxy_host}
              onChange={(e) => setConfig({ ...config, proxy_host: e.target.value })}
              disabled={!config.proxy_enabled}
              placeholder="proxy.ejemplo.com o 123.45.67.89"
              className="w-full p-3 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Puerto *
            </label>
            <input
              type="number"
              value={config.proxy_port || ''}
              onChange={(e) => setConfig({ ...config, proxy_port: parseInt(e.target.value) || null })}
              disabled={!config.proxy_enabled}
              placeholder="8080"
              min="1"
              max="65535"
              className="w-full p-3 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Authentication */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Usuario (opcional)
            </label>
            <input
              type="text"
              value={config.proxy_username}
              onChange={(e) => setConfig({ ...config, proxy_username: e.target.value })}
              disabled={!config.proxy_enabled}
              placeholder="usuario"
              className="w-full p-3 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Contraseña (opcional)
            </label>
            <input
              type="password"
              value={config.proxy_password}
              onChange={(e) => setConfig({ ...config, proxy_password: e.target.value })}
              disabled={!config.proxy_enabled}
              placeholder="••••••••"
              className="w-full p-3 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            País (opcional)
          </label>
          <input
            type="text"
            value={config.proxy_country}
            onChange={(e) => setConfig({ ...config, proxy_country: e.target.value })}
            disabled={!config.proxy_enabled}
            placeholder="US, MX, ES, etc."
            maxLength={2}
            className="w-full p-3 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
            Código de país de 2 letras (ISO 3166-1 alpha-2)
          </p>
        </div>

        {/* Rotation */}
        <div className="border-t border-gray-200 dark:border-zinc-700 pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ArrowPathIcon className="w-5 h-5 text-gray-500 dark:text-zinc-400" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Rotación Automática
                </h3>
                <p className="text-sm text-gray-600 dark:text-zinc-400">
                  Cambiar IP periódicamente
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.proxy_rotation}
                onChange={(e) => setConfig({ ...config, proxy_rotation: e.target.checked })}
                disabled={!config.proxy_enabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {config.proxy_rotation && (
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Rotar cada (minutos)
              </label>
              <input
                type="number"
                value={config.proxy_rotation_minutes}
                onChange={(e) => setConfig({ ...config, proxy_rotation_minutes: parseInt(e.target.value) || 30 })}
                disabled={!config.proxy_enabled}
                min="1"
                max="1440"
                className="w-full p-3 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          )}
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`p-4 rounded-lg border ${
            testResult.success
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-start gap-3">
              {testResult.success ? (
                <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm ${
                testResult.success
                  ? 'text-green-800 dark:text-green-300'
                  : 'text-red-800 dark:text-red-300'
              }`}>
                {testResult.message}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleTest}
            disabled={!config.proxy_enabled || testing || !config.proxy_host || !config.proxy_port}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {testing ? (
              <>
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                Probando...
              </>
            ) : (
              <>
                <GlobeAltIcon className="w-5 h-5" />
                Probar Conexión
              </>
            )}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
          📝 Recomendaciones
        </h3>
        <ul className="text-sm text-yellow-800 dark:text-yellow-400 space-y-1">
          <li>• Usa proxies residenciales para mejor rendimiento</li>
          <li>• Servicios recomendados: Bright Data, Smartproxy, Oxylabs</li>
          <li>• Activa rotación para envíos masivos (100+ mensajes)</li>
          <li>• Verifica que el proxy soporte HTTPS para mayor seguridad</li>
        </ul>
      </div>
    </div>
  );
}

export default function ProxySettings() {
  return (
    <SessionProvider>
      <Sidebard>
        <ProxySettingsContent />
      </Sidebard>
    </SessionProvider>
  );
}
