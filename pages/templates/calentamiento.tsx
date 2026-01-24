import { SessionProvider, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';
import Sidebard from '../components/dashboard/index';
import {
  ArrowLeftIcon,
  FireIcon,
  ClockIcon,
  ChartBarIcon,
  PlayIcon,
  StopIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  KeyIcon
} from '@heroicons/react/24/outline';

interface Instance {
  documentId: string;
  state: string;
  phoneNumber?: string;
  name?: string;
}

function CalentamientoContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedInstances, setSelectedInstances] = useState<string[]>([]);
  const [conversationTheme, setConversationTheme] = useState('Temas de negocio y tecnología');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calentamientoStatus, setCalentamientoStatus] = useState<any>(null);
  const [availableInstances, setAvailableInstances] = useState<Instance[]>([]);
  const [useIA, setUseIA] = useState(false);
  const [iaStatus, setIaStatus] = useState<any>(null);

  // BYO API Key State
  const [aiProvider, setAiProvider] = useState<'openai' | 'gemini'>('openai');
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [isContinuous, setIsContinuous] = useState(false);

  // Saved keys from profile
  const [savedOpenaiKey, setSavedOpenaiKey] = useState('');
  const [savedGeminiKey, setSavedGeminiKey] = useState('');

  // Configuración del calentamiento por fases
  const calentamientoPhases = [
    { day: 1, messages: 5, description: "Inicio suave - 5 mensajes" },
    { day: 2, messages: 10, description: "Aumento gradual - 10 mensajes" },
    { day: 3, messages: 15, description: "Construyendo confianza - 15 mensajes" },
    { day: 4, messages: 25, description: "Crecimiento moderado - 25 mensajes" },
    { day: 5, messages: 35, description: "Fase de adaptación - 35 mensajes" },
    { day: 6, messages: 50, description: "Consolidación - 50 mensajes" },
    { day: 7, messages: 75, description: "Crecimiento sostenido - 75 mensajes" },
    { day: 8, messages: 100, description: "Alta actividad - 100 mensajes" },
    { day: 9, messages: 125, description: "Máximo diario - 125 mensajes" },
    { day: 10, messages: 150, description: "Cuenta completamente caliente - 150 mensajes" },
  ];

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchInstances();
      fetchProfileKeys();
    }
  }, [status, router]);

  const fetchProfileKeys = async () => {
    try {
      const response = await axios.post('/api/user/get');
      const data = response.data;
      setSavedOpenaiKey(data.openai_api_key || '');
      setSavedGeminiKey(data.gemini_api_key || '');

      // Initial fill for default provider
      if (aiProvider === 'openai') setApiKey(data.openai_api_key || '');
      else setApiKey(data.gemini_api_key || '');
    } catch (error) {
      console.error('Error fetching profile keys:', error);
    }
  };

  const fetchInstances = async () => {
    try {
      const res = await axios.get('/api/instances');
      const allInstances = res.data.instances || [];

      const mappedInstances = allInstances.map((item: any) => ({
        documentId: item.document_id || item.documentId,
        state: item.state,
        phoneNumber: item.phone_number || item.phoneNumber,
        name: item.profile_name || item.name || 'Instancia',
      }));

      const connectedInstances = mappedInstances.filter(
        (i: any) => i.state === 'Connected'
      );

      setInstances(connectedInstances);
      setAvailableInstances(connectedInstances);

      // 🔍 AUTO-DETECT: Check status immediately after loading instances if any are connected
      if (connectedInstances.length > 0) {
        // We select the first one to check status, as status is usually shared per user session in this context
        // Or we could check all, but let's check the first valid one.
        const firstId = connectedInstances[0].documentId;

        // Try to restore IA Status first (Premium)
        try {
          const { data: iaData } = await axios.get(`/api/templates/calentamiento-ia?instanceId=${firstId}`);
          if (iaData && iaData.isActive) {
            setUseIA(true);
            setIaStatus(iaData);
            setSelectedInstances([firstId]); // Auto select it to show UI
            console.log('✅ Restaurado estado de Calentamiento IA');
            return; // Exit if found
          }
        } catch (e) { /* ignore */ }

        // Try to restore Normal Status
        try {
          const { data: normalData } = await axios.get(`/api/templates/calentamiento?instanceId=${firstId}`);
          if (normalData && normalData.isActive) {
            setUseIA(false);
            setCalentamientoStatus(normalData);
            setSelectedInstances([firstId]); // Auto select it
            console.log('✅ Restaurado estado de Calentamiento Normal');
          }
        } catch (e) { /* ignore */ }
      }

    } catch (error) {
      console.error('Error fetching instances:', error);
      toast.error('Error al cargar las instancias');
    }
  };

  const startCalentamiento = async () => {
    if (selectedInstances.length === 0) {
      toast.error('Selecciona al menos una instancia');
      return;
    }

    setIsSubmitting(true);
    try {
      // Iniciamos calentamiento tradicional para cada instancia seleccionada
      for (const instanceId of selectedInstances) {
        await axios.post('/api/templates/calentamiento', {
          instanceId,
          action: 'start'
        });
      }

      toast.success('Calentamiento iniciado exitosamente');
      // Status will be updated via checkStatus or automatic polling if implemented
    } catch (error: any) {
      console.error('Error starting calentamiento:', error);
      toast.error(error.response?.data?.error || 'Error al iniciar calentamiento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stopCalentamiento = async () => {
    if (selectedInstances.length === 0) return;

    try {
      for (const instanceId of selectedInstances) {
        await axios.post('/api/templates/calentamiento', {
          instanceId,
          action: 'stop'
        });
      }

      toast.success('Calentamiento detenido');
      setCalentamientoStatus(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al detener calentamiento');
    }
  };

  const checkStatus = async () => {
    if (selectedInstances.length === 0) return;

    try {
      const instanceId = selectedInstances[0]; // Consultamos el primero por defecto
      const endpoint = useIA ? '/api/templates/calentamiento-ia' : '/api/templates/calentamiento';
      const { data } = await axios.get(`${endpoint}?instanceId=${instanceId}`);
      if (useIA) {
        setIaStatus(data);
      } else {
        setCalentamientoStatus(data);
      }
    } catch (error: any) {
      console.error('Error checking status:', error);
    }
  };

  // Efecto para auto-refrescar estado en modo IA
  useEffect(() => {
    let interval: any;
    if (useIA && iaStatus?.isActive) {
      interval = setInterval(() => {
        checkStatus();
      }, 10000); // Cada 10 segundos
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [useIA, iaStatus?.isActive]);

  const startIAConversation = async () => {
    if (selectedInstances.length < 2) {
      toast.error('Selecciona al menos 2 instancias para conversar entre ellas');
      return;
    }

    if (availableInstances.length < 2) {
      toast.error('Se necesitan al menos 2 instancias conectadas para conversaciones IA');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post('/api/templates/calentamiento-ia', {
        instanceIds: selectedInstances,
        action: 'start',
        provider: aiProvider,
        apiKey: apiKey,
        theme: conversationTheme,
        unlimited: isContinuous
      });

      toast.success('Conversación IA iniciada exitosamente');
      setIaStatus(response.data);
      // Forzar primer refresh inmediato
      setTimeout(() => checkStatus(), 2000);
    } catch (error: any) {
      console.error('Error starting IA conversation:', error);
      toast.error(error.response?.data?.error || 'Error al iniciar conversación IA');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stopIAConversation = async () => {
    if (selectedInstances.length === 0) return;

    try {
      for (const instanceId of selectedInstances) {
        await axios.post('/api/templates/calentamiento-ia', {
          instanceId,
          action: 'stop'
        });
      }

      toast.success('Conversación IA detenida');
      setIaStatus(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al detener conversación IA');
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-transparent">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const selectedInstanceId = selectedInstances[0] || '';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-transparent p-6 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/templates"
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-4 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Volver a Plantillas
        </Link>

        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-2xl">
            <FireIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
              Calentamiento WhatsApp
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Calienta tu cuenta gradualmente para evitar bloqueos y bans
            </p>
          </div>
        </div>
      </div>

      {/* Instance Selection */}
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 border border-slate-100 dark:border-slate-800 mb-8">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
          Seleccionar Instancia
        </h2>

        {instances.length === 0 ? (
          <div className="text-center py-8">
            <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-4 text-amber-500" />
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              No tienes instancias conectadas
            </p>
            <Link
              href="/instances"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-2.5 rounded-xl hover:shadow-lg transition-all"
            >
              Crear Instancia
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {instances.map((instance) => (
                <button
                  key={instance.documentId}
                  onClick={() => {
                    setSelectedInstances(prev =>
                      prev.includes(instance.documentId)
                        ? prev.filter(id => id !== instance.documentId)
                        : [...prev, instance.documentId]
                    );
                  }}
                  className={`p-4 rounded-xl border-2 transition-all ${selectedInstances.includes(instance.documentId)
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                    : 'border-slate-200 dark:border-slate-700 hover:border-red-300'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${instance.state === 'Connected' ? 'bg-emerald-500' : 'bg-red-500'
                      }`} />
                    <div className="text-left">
                      <p className="font-medium text-slate-800 dark:text-white">
                        {instance.name || 'Sin nombre'}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {instance.phoneNumber || 'Sin número'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {selectedInstances.length > 0 && (
              <div className="space-y-4">
                {/* Selección de tipo de calentamiento */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
                  <h3 className="font-bold text-slate-800 dark:text-white mb-3">
                    🎯 Elige tu método de calentamiento
                  </h3>

                  <div className="space-y-3">
                    {/* Opción: Calentamiento normal */}
                    <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${!useIA
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                      }`}>
                      <input
                        type="radio"
                        name="calentamiento-type"
                        checked={!useIA}
                        onChange={() => setUseIA(false)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-800 dark:text-white">
                            🔥 Calentamiento Tradicional
                          </span>
                          {availableInstances.length > 1 && (
                            <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                              Recomendado
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {availableInstances.length > 1
                            ? `Mensajes entre tus ${availableInstances.length} instancias conectadas`
                            : "Mensajes de prueba seguros"
                          }
                        </p>
                      </div>
                    </label>

                    {/* Opción: Calentamiento con IA */}
                    <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${useIA
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-purple-300'
                      } ${availableInstances.length < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input
                        type="radio"
                        name="calentamiento-type"
                        checked={useIA}
                        onChange={() => availableInstances.length >= 2 && setUseIA(true)}
                        disabled={availableInstances.length < 2}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-800 dark:text-white">
                            🤖 Conversaciones con IA
                          </span>
                          <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full">
                            Premium
                          </span>
                          {availableInstances.length < 2 && (
                            <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full">
                              Requiere 2+ instancias
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Conversaciones naturales generadas por IA entre tus instancias
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Configuración de IA */}
                  {useIA && (
                    <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 animate-fadeIn">
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800/50 shadow-sm">
                        <h4 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                          <SparklesIcon className="w-5 h-5 text-purple-500 animate-pulse" />
                          Configuración de IA Requerida
                        </h4>
                        <p className="text-sm text-purple-600 dark:text-purple-300 mb-4">
                          Para usar conversaciones inteligentes, necesitas ingresar tu propia API Key. Esto permite diálogos realistas y personalizados.
                        </p>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Proveedor de Inteligencia Artificial
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setAiProvider('openai');
                                  setApiKey(savedOpenaiKey);
                                }}
                                className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${aiProvider === 'openai'
                                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                  }`}
                              >
                                <span>ChatGPT (OpenAI)</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setAiProvider('gemini');
                                  setApiKey(savedGeminiKey);
                                }}
                                className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${aiProvider === 'gemini'
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                  }`}
                              >
                                <span>Google Gemini</span>
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Tema o Personalidad de la Conversación
                            </label>
                            <input
                              type="text"
                              value={conversationTheme}
                              onChange={(e) => setConversationTheme(e.target.value)}
                              placeholder="Ej: Hablar sobre el cuidado de la Tierra y ecología"
                              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-purple-200 dark:border-purple-800 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                            />
                            <p className="mt-1 text-[10px] text-slate-500">
                              Define de qué hablarán las instancias entre sí.
                            </p>
                          </div>

                          <div className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border-2 border-indigo-100 dark:border-indigo-800/30">
                            <div className="flex items-center h-5">
                              <input
                                id="continuous-mode"
                                type="checkbox"
                                checked={isContinuous}
                                onChange={(e) => setIsContinuous(e.target.checked)}
                                className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                              />
                            </div>
                            <label htmlFor="continuous-mode" className="ml-2 cursor-pointer">
                              <span className="block text-sm font-bold text-indigo-900 dark:text-indigo-300">🚀 Modo Infinito</span>
                              <span className="block text-xs text-indigo-700 dark:text-indigo-400">Conversación sin límites diarios (continuar hasta detener manualmente).</span>
                            </label>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Tu API Key de {aiProvider === 'openai' ? 'OpenAI' : 'Google Gemini'}
                            </label>
                            <div className="relative group">
                              <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder={aiProvider === 'openai' ? "sk-..." : "AIza..."}
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border-2 border-purple-300 dark:border-purple-700 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all shadow-sm group-hover:border-purple-400"
                              />
                              <KeyIcon className="w-5 h-5 text-purple-400 absolute left-3 top-3.5" />
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-xs font-medium bg-slate-100 dark:bg-slate-700 p-2 rounded-lg">
                              <KeyIcon className="w-3.5 h-3.5" />
                              <span>
                                {aiProvider === 'openai'
                                  ? 'Crea tu key en: platform.openai.com/api-keys'
                                  : 'Crea tu key en: aistudio.google.com/app/apikey'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botones de control PRO */}
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                  {/* Botón Principal Dinámico */}
                  {!((useIA ? iaStatus?.isActive : calentamientoStatus?.isActive)) ? (
                    <button
                      onClick={useIA ? startIAConversation : startCalentamiento}
                      disabled={isSubmitting || (selectedInstances.length === 0) || (useIA && selectedInstances.length < 2) || (useIA && !apiKey)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-500 text-white px-8 py-4 rounded-2xl hover:shadow-[0_4px_14px_rgba(239,68,68,0.5)] active:scale-95 transition-all text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/50 border-t-white" />
                          <span>Iniciando...</span>
                        </>
                      ) : (
                        <>
                          <PlayIcon className="w-6 h-6 group-hover:fill-white/20 transition-all" />
                          <span>{useIA ? 'Iniciar IA Inteligente' : 'Iniciar Calentamiento'}</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="w-full sm:w-auto flex items-center justify-center gap-3 bg-emerald-500/10 border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 px-8 py-4 rounded-2xl animate-pulse cursor-default">
                      <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </div>
                      <span className="font-bold text-lg">Ejecutando en Segundo Plano</span>
                    </div>
                  )}

                  {/* Botón Detener (Solo visible si está activo) */}
                  {((useIA ? iaStatus?.isActive : calentamientoStatus?.isActive)) && (
                    <button
                      onClick={useIA ? stopIAConversation : stopCalentamiento}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-6 py-4 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 border border-transparent hover:border-red-200 dark:hover:border-red-800 transition-all font-medium"
                    >
                      <StopIcon className="w-5 h-5" />
                      Detener Proceso
                    </button>
                  )}

                  {/* Botón Estado */}
                  <button
                    onClick={checkStatus}
                    className="ml-auto w-full sm:w-auto flex items-center justify-center gap-2 text-slate-500 hover:text-blue-500 dark:text-slate-400 dark:hover:text-blue-400 transition-colors px-4 py-2"
                  >
                    <ChartBarIcon className="w-5 h-5" />
                    <span className="underline decoration-dotted underline-offset-4">Actualizar Estado</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Calentamiento Phases */}
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 border border-slate-100 dark:border-slate-800 mb-8">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-3">
          <ArrowTrendingUpIcon className="w-6 h-6" />
          Fases del Calentamiento
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {calentamientoPhases.map((phase) => (
            <div
              key={phase.day}
              className={`p-4 rounded-xl border-2 transition-all ${(useIA ? iaStatus : calentamientoStatus)?.currentPhase >= phase.day
                ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10'
                : 'border-slate-200 dark:border-slate-700'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Día {phase.day}
                </span>
                {(useIA ? iaStatus : calentamientoStatus)?.currentPhase >= phase.day && (
                  <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                )}
              </div>
              <div className="flex items-center gap-2 mb-1">
                <FireIcon className="w-4 h-4 text-red-500" />
                <span className="font-bold text-slate-800 dark:text-white">
                  {phase.messages} mensajes
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {phase.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Status Information */}
      {(calentamientoStatus || iaStatus) && (
        <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-3">
            {useIA ? <SparklesIcon className="w-6 h-6 text-purple-500" /> : <FireIcon className="w-6 h-6 text-red-500" />}
            Estado del {useIA ? 'Calentamiento IA' : 'Calentamiento'}
          </h2>

          {useIA && iaStatus && (
            <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800/30">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                <SparklesIcon className="w-5 h-5" />
                <span className="font-medium">
                  Conversación IA activa con {iaStatus.participantCount || 0} participantes
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-2xl p-6 border border-blue-100 dark:border-blue-800/30">
              <div className="flex items-center gap-3 mb-3">
                <ClockIcon className="w-6 h-6 text-blue-500" />
                <span className="font-bold text-slate-800 dark:text-white">Fase Actual</span>
              </div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {(useIA ? iaStatus : calentamientoStatus)?.currentPhase || 1}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                de 10 fases
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-800/30">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircleIcon className="w-6 h-6 text-emerald-500" />
                <span className="font-bold text-slate-800 dark:text-white">Mensajes Enviados</span>
              </div>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {(useIA ? iaStatus : calentamientoStatus)?.messagesSent || 0}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                hoy
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-2xl p-6 border border-amber-100 dark:border-amber-800/30">
              <div className="flex items-center gap-3 mb-3">
                <FireIcon className="w-6 h-6 text-amber-500" />
                <span className="font-bold text-slate-800 dark:text-white">Próximo Límite</span>
              </div>
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {calentamientoPhases[((useIA ? iaStatus : calentamientoStatus)?.currentPhase || 1) - 1]?.messages || 5}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                mensajes diarios
              </p>
            </div>
          </div>

          {/* Activity Log (SÓLO PARA IA) */}
          {useIA && iaStatus?.isActive && (
            <div className="mt-8">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-purple-500" />
                Log de Actividad en Tiempo Real
              </h3>
              <div className="bg-slate-900 rounded-2xl p-4 font-mono text-xs overflow-y-auto max-h-60 border border-slate-700">
                {iaStatus.conversationHistory?.length > 0 ? (
                  <div className="space-y-2">
                    {[...iaStatus.conversationHistory].reverse().map((log: any, index: number) => (
                      <div key={index} className="flex gap-2 border-b border-slate-800 pb-2 last:border-0">
                        <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span className="text-emerald-400 font-bold">{log.from === selectedInstanceId ? 'TÚ' : 'INSTANCIA'}</span>
                        <span className="text-slate-400">→</span>
                        <span className="text-blue-400 font-bold">{log.to?.substring(0, 8) || 'DESTINO'}</span>
                        <span className="text-slate-300 ml-2">{log.content}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                    <div className="animate-pulse mb-2">● Esperando primer mensaje de IA...</div>
                    <p className="text-[10px]">Las conversaciones pueden tardar hasta 1 minuto en iniciar para parecer naturales.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <h3 className="font-bold text-slate-800 dark:text-white mb-2">
              💡 Consejos para el calentamiento:
            </h3>
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <li>• Envía mensajes naturales y variados</li>
              <li>• Mantén conversaciones bidireccionales</li>
              <li>• No envíes todos los mensajes de golpe</li>
              <li>• Respeta los límites diarios de cada fase</li>
              <li>• Si ves errores, reduce la velocidad</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Calentamiento() {
  return (
    <Sidebard>
      <CalentamientoContent />
    </Sidebard>
  );
}