import { SessionProvider, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { toast, Toaster } from 'sonner';
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
  TrendingUpIcon
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
  const [selectedInstance, setSelectedInstance] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calentamientoStatus, setCalentamientoStatus] = useState<any>(null);
  const [availableInstances, setAvailableInstances] = useState<Instance[]>([]);

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
    }
  }, [status, router]);

  const fetchInstances = async () => {
    try {
      const res = await axios.get('/api/instances');
      const connectedInstances = res.data.instances.filter(
        (i: any) => i.state === 'Connected'
      );
      setInstances(connectedInstances);
      setAvailableInstances(connectedInstances); // Guardar todas para mostrar info
    } catch (error) {
      console.error('Error fetching instances:', error);
      toast.error('Error al cargar las instancias');
    }
  };

  const startCalentamiento = async () => {
    if (!selectedInstance) {
      toast.error('Selecciona una instancia');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post('/api/templates/calentamiento', {
        instanceId: selectedInstance,
        action: 'start'
      });

      toast.success('Calentamiento iniciado exitosamente');
      setCalentamientoStatus(response.data);
    } catch (error: any) {
      console.error('Error starting calentamiento:', error);
      toast.error(error.response?.data?.error || 'Error al iniciar calentamiento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stopCalentamiento = async () => {
    if (!selectedInstance) return;

    try {
      await axios.post('/api/templates/calentamiento', {
        instanceId: selectedInstance,
        action: 'stop'
      });

      toast.success('Calentamiento detenido');
      setCalentamientoStatus(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al detener calentamiento');
    }
  };

  const checkStatus = async () => {
    if (!selectedInstance) return;

    try {
      const response = await axios.get(`/api/templates/calentamiento?instanceId=${selectedInstance}`);
      setCalentamientoStatus(response.data);
    } catch (error: any) {
      console.error('Error checking status:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-transparent">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-transparent p-6 sm:p-8">
      <Toaster richColors position="top-right" />

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
                  onClick={() => setSelectedInstance(instance.documentId)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedInstance === instance.documentId
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                      : 'border-slate-200 dark:border-slate-700 hover:border-red-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      instance.state === 'Connected' ? 'bg-emerald-500' : 'bg-red-500'
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

            {selectedInstance && (
              <div className="space-y-4">
                {/* Información sobre el tipo de calentamiento */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
                  <h3 className="font-bold text-slate-800 dark:text-white mb-2">
                    📱 Tipo de Calentamiento
                  </h3>
                  {availableInstances.length > 1 ? (
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                      <SparklesIcon className="w-5 h-5" />
                      <span className="font-medium">
                        Calentamiento entre instancias ({availableInstances.length} números disponibles)
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <ExclamationTriangleIcon className="w-5 h-5" />
                      <span className="font-medium">
                        Calentamiento con mensajes de prueba (solo 1 instancia disponible)
                      </span>
                    </div>
                  )}
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {availableInstances.length > 1
                      ? "Los mensajes se enviarán entre tus propias instancias conectadas para conversaciones naturales."
                      : "Se usarán mensajes de prueba seguros que no molestan a contactos reales."
                    }
                  </p>
                </div>

                {/* Botones de control */}
                <div className="flex items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={startCalentamiento}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2.5 rounded-xl hover:shadow-lg disabled:opacity-50"
                  >
                    <PlayIcon className="w-5 h-5" />
                    {isSubmitting ? 'Iniciando...' : 'Iniciar Calentamiento'}
                  </button>

                  <button
                    onClick={stopCalentamiento}
                    className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <StopIcon className="w-5 h-5" />
                    Detener
                  </button>

                  <button
                    onClick={checkStatus}
                    className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-6 py-2.5 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-800/30"
                  >
                    <ChartBarIcon className="w-5 h-5" />
                    Ver Estado
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
          <TrendingUpIcon className="w-6 h-6" />
          Fases del Calentamiento
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {calentamientoPhases.map((phase, index) => (
            <div
              key={phase.day}
              className={`p-4 rounded-xl border-2 transition-all ${
                calentamientoStatus?.currentPhase >= phase.day
                  ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Día {phase.day}
                </span>
                {calentamientoStatus?.currentPhase >= phase.day && (
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
      {calentamientoStatus && (
        <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
            Estado del Calentamiento
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-2xl p-6 border border-blue-100 dark:border-blue-800/30">
              <div className="flex items-center gap-3 mb-3">
                <ClockIcon className="w-6 h-6 text-blue-500" />
                <span className="font-bold text-slate-800 dark:text-white">Fase Actual</span>
              </div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {calentamientoStatus.currentPhase || 1}
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
                {calentamientoStatus.messagesSent || 0}
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
                {calentamientoPhases[calentamientoStatus.currentPhase - 1]?.messages || 5}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                mensajes diarios
              </p>
            </div>
          </div>

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