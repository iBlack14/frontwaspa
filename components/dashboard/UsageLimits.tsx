import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ChartBarIcon, 
  ServerIcon, 
  ChatBubbleLeftRightIcon,
  BellAlertIcon,
  SparklesIcon,
  ArrowUpIcon,
  CubeIcon
} from '@heroicons/react/24/outline';

interface UsageData {
  plan: {
    type: string;
    status: string;
  };
  limits: {
    instances: {
      current: number;
      max: number;
      percent: number;
      available: number;
    };
    messages: {
      current: number;
      max: number;
      percent: number;
      available: number;
      resets_at: string;
    };
    webhooks: {
      current: number;
      max: number;
      percent: number;
      available: number;
    };
    suites: {
      current: number;
      max: number;
      percent: number;
      available: number;
    };
  };
  warnings: {
    instances_limit_reached: boolean;
    messages_limit_reached: boolean;
    webhooks_limit_reached: boolean;
    suites_limit_reached: boolean;
    messages_near_limit: boolean;
  };
}

export default function UsageLimits() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsage();
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchUsage, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsage = async () => {
    try {
      const response = await axios.get('/api/user/usage');
      setUsage(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching usage:', err);
      setError('Error al cargar límites');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 dark:bg-zinc-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !usage) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-4">
        <p className="text-red-700 dark:text-red-400 text-sm">{error || 'Error al cargar datos'}</p>
      </div>
    );
  }

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 70) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const getTextColor = (percent: number) => {
    if (percent >= 90) return 'text-red-600 dark:text-red-400';
    if (percent >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-emerald-600 dark:text-emerald-400';
  };

  return (
    <div className="space-y-4">
      {/* Header con Plan */}
      <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Plan Actual</p>
            <h3 className="text-2xl font-bold capitalize">{usage.plan.type}</h3>
          </div>
          <SparklesIcon className="w-10 h-10 opacity-80" />
        </div>
      </div>

      {/* Warnings */}
      {(usage.warnings.instances_limit_reached || 
        usage.warnings.messages_limit_reached || 
        usage.warnings.suites_limit_reached ||
        usage.warnings.messages_near_limit) && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <BellAlertIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                Límite Alcanzado
              </h4>
              <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                {usage.warnings.instances_limit_reached && (
                  <li>• Has alcanzado el límite de instancias</li>
                )}
                {usage.warnings.messages_limit_reached && (
                  <li>• Has alcanzado el límite de mensajes por hoy</li>
                )}
                {usage.warnings.suites_limit_reached && (
                  <li>• Has alcanzado el límite de suites (N8N)</li>
                )}
                {usage.warnings.messages_near_limit && !usage.warnings.messages_limit_reached && (
                  <li>• Estás cerca del límite de mensajes</li>
                )}
              </ul>
              <button
                onClick={() => window.location.href = '/subscription'}
                className="mt-3 inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                <ArrowUpIcon className="w-4 h-4" />
                Mejorar Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Usage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Instancias */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ServerIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Instancias</p>
              <p className={`text-lg font-bold ${getTextColor(usage.limits.instances.percent)}`}>
                {usage.limits.instances.current} / {usage.limits.instances.max}
              </p>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-zinc-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getProgressColor(usage.limits.instances.percent)}`}
              style={{ width: `${Math.min(usage.limits.instances.percent, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {usage.limits.instances.available} disponible(s)
          </p>
        </div>

        {/* Mensajes */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Mensajes Hoy</p>
              <p className={`text-lg font-bold ${getTextColor(usage.limits.messages.percent)}`}>
                {usage.limits.messages.current} / {usage.limits.messages.max}
              </p>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-zinc-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getProgressColor(usage.limits.messages.percent)}`}
              style={{ width: `${Math.min(usage.limits.messages.percent, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Reinicia a {usage.limits.messages.resets_at}
          </p>
        </div>

        {/* Webhooks */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <ChartBarIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Webhooks</p>
              <p className={`text-lg font-bold ${getTextColor(usage.limits.webhooks.percent)}`}>
                {usage.limits.webhooks.current} / {usage.limits.webhooks.max}
              </p>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-zinc-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getProgressColor(usage.limits.webhooks.percent)}`}
              style={{ width: `${Math.min(usage.limits.webhooks.percent, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {usage.limits.webhooks.available} disponible(s)
          </p>
        </div>

        {/* Suites (N8N) */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <CubeIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Suites (N8N)</p>
              <p className={`text-lg font-bold ${getTextColor(usage.limits.suites.percent)}`}>
                {usage.limits.suites.current} / {usage.limits.suites.max}
              </p>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-zinc-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getProgressColor(usage.limits.suites.percent)}`}
              style={{ width: `${Math.min(usage.limits.suites.percent, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {usage.limits.suites.available} disponible(s)
          </p>
        </div>
      </div>

      {/* Upgrade CTA */}
      {usage.plan.type === 'free' && (
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                ¿Necesitas más recursos?
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Mejora tu plan y obtén más instancias, mensajes y funciones premium
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/subscription'}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 py-2 rounded-lg font-medium transition whitespace-nowrap"
            >
              Ver Planes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
