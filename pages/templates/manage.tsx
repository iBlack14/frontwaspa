import { SessionProvider, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';
import Sidebard from '../components/dashboard/index';
import {
  ArrowLeftIcon,
  SparklesIcon,
  CpuChipIcon,
  CircleStackIcon,
  SignalIcon,
  CheckCircleIcon,
  XCircleIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Instance {
  documentId: string;
  state: string;
  phoneNumber?: string;
  name?: string;
  activeTemplate?: string;
  templateConfig?: any;
}

const templateInfo = {
  none: {
    name: 'Sin Template',
    icon: '⚪',
    color: 'slate',
    bgColor: 'bg-slate-50/50 dark:bg-slate-900/10',
    borderColor: 'border-slate-100 dark:border-slate-800/30',
    resources: { cpu: 0, memory: 0, bandwidth: 0 },
    description: 'Instancia sin automatización',
  },
  spam: {
    name: 'SPAM WhatsApp',
    icon: '📨',
    color: 'emerald',
    bgColor: 'bg-emerald-50/50 dark:bg-emerald-900/10',
    borderColor: 'border-emerald-100 dark:border-emerald-800/30',
    resources: { cpu: 30, memory: 50, bandwidth: 80 },
    description: 'Envío masivo de mensajes',
  },
  chatbot: {
    name: 'Chatbot IA',
    icon: '🤖',
    color: 'blue',
    bgColor: 'bg-blue-50/50 dark:bg-blue-900/10',
    borderColor: 'border-blue-100 dark:border-blue-800/30',
    resources: { cpu: 20, memory: 40, bandwidth: 30 },
    description: 'Respuestas automáticas inteligentes',
  },
  calentamiento: {
    name: 'Calentamiento',
    icon: '🔥',
    color: 'red',
    bgColor: 'bg-red-50/50 dark:bg-red-900/10',
    borderColor: 'border-red-100 dark:border-red-800/30',
    resources: { cpu: 15, memory: 30, bandwidth: 20 },
    description: 'Calentamiento gradual de cuentas',
  },
};

function ManageTemplatesContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchInstances();
    }
  }, [status]);

  const fetchInstances = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get('/api/instances');

      const mappedInstances = res.data.instances.map((item: any) => ({
        documentId: item.document_id || item.documentId,
        state: item.state,
        phoneNumber: item.phone_number || item.phoneNumber,
        name: item.profile_name || item.name || 'Instancia',
        activeTemplate: item.active_template || 'none',
        templateConfig: item.template_config || null,
      }));

      setInstances(mappedInstances);
    } catch (error) {
      console.error('Error fetching instances:', error);
      toast.error('Error al cargar instancias');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeTemplate = async (instanceId: string, templateType: string) => {
    try {
      await axios.post('/api/templates/assign', {
        instanceId,
        templateType,
      });

      toast.success(`Template ${templateInfo[templateType as keyof typeof templateInfo].name} asignado`);
      fetchInstances();
      setShowModal(false);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || 'Error al asignar template');
    }
  };

  const getTotalResources = () => {
    return instances.reduce((acc, instance) => {
      const template = instance.activeTemplate || 'none';
      const resources = templateInfo[template as keyof typeof templateInfo].resources;
      return {
        cpu: acc.cpu + resources.cpu,
        memory: acc.memory + resources.memory,
        bandwidth: acc.bandwidth + resources.bandwidth,
      };
    }, { cpu: 0, memory: 0, bandwidth: 0 });
  };

  const totalResources = getTotalResources();

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-transparent">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-transparent p-6 sm:p-8">


      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/templates"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
              Gestión de Templates
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Administra y asigna templates a tus instancias
            </p>
          </div>
        </div>
      </div>

      {/* Resumen de Recursos */}
      <div className="mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-xl">
            <CpuChipIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            Uso Total de Recursos
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CPU */}
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CpuChipIcon className="w-5 h-5 text-blue-500" />
                <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">CPU</span>
              </div>
              <span className="text-lg font-bold text-slate-800 dark:text-white">{totalResources.cpu}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(totalResources.cpu, 100)}%` }}
              />
            </div>
          </div>

          {/* Memoria */}
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CircleStackIcon className="w-5 h-5 text-emerald-500" />
                <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">Memoria</span>
              </div>
              <span className="text-lg font-bold text-slate-800 dark:text-white">{totalResources.memory}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(totalResources.memory, 100)}%` }}
              />
            </div>
          </div>

          {/* Ancho de Banda */}
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <SignalIcon className="w-5 h-5 text-amber-500" />
                <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">Ancho de Banda</span>
              </div>
              <span className="text-lg font-bold text-slate-800 dark:text-white">{totalResources.bandwidth}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(totalResources.bandwidth, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <p className="text-slate-600 dark:text-slate-400 text-sm mt-4 flex items-center gap-2">
          <SparklesIcon className="w-4 h-4" />
          Tip: El chatbot consume menos recursos que el spam masivo
        </p>
      </div>

      {/* Comparación de Templates */}
      <div className="mb-8 bg-white dark:bg-[#1e293b] border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
          Comparación de Templates
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(templateInfo).map(([key, info]) => {
            if (key === 'none') return null;
            const totalUsage = info.resources.cpu + info.resources.memory + info.resources.bandwidth;
            const isLowUsage = totalUsage < 100;

            return (
              <div
                key={key}
                className={`${info.bgColor} rounded-2xl p-5 border ${info.borderColor} hover:shadow-lg transition-all duration-300`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{info.icon}</div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white">{info.name}</h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">{info.description}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">CPU:</span>
                    <span className={`font-semibold ${info.resources.cpu > 25 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {info.resources.cpu}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Memoria:</span>
                    <span className={`font-semibold ${info.resources.memory > 45 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {info.resources.memory}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Ancho de Banda:</span>
                    <span className={`font-semibold ${info.resources.bandwidth > 50 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {info.resources.bandwidth}%
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${isLowUsage
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    }`}>
                    {isLowUsage ? '⚡ Bajo consumo' : '⚠️ Alto consumo'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista de Instancias */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
          Mis Instancias ({instances.length})
        </h2>

        {instances.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📱</div>
            <p className="text-slate-500 dark:text-slate-400 mb-6">No tienes instancias creadas</p>
            <Link
              href="/instances"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-2.5 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 transform hover:-translate-y-0.5 font-medium"
            >
              Crear Instancia
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {instances.map((instance) => {
              const template = instance.activeTemplate || 'none';
              const info = templateInfo[template as keyof typeof templateInfo];

              return (
                <div
                  key={instance.documentId}
                  className={`group ${info.bgColor} border ${info.borderColor} rounded-2xl p-5 hover:shadow-lg transition-all duration-300`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-3xl">{info.icon}</div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-800 dark:text-white">{instance.name}</h3>
                          <p className="text-slate-600 dark:text-slate-400 text-sm">{instance.phoneNumber || 'Sin número'}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${instance.state === 'Connected'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}>
                          {instance.state === 'Connected' ? (
                            <span className="flex items-center gap-1">
                              <CheckCircleIcon className="w-4 h-4" />
                              Conectada
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <XCircleIcon className="w-4 h-4" />
                              Desconectada
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600 dark:text-slate-400 text-sm">Template Activo:</span>
                          <span className="px-3 py-1 rounded-lg text-sm font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {info.name}
                          </span>
                        </div>

                        {template !== 'none' && (
                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                            <span>CPU: {info.resources.cpu}%</span>
                            <span>RAM: {info.resources.memory}%</span>
                            <span>BW: {info.resources.bandwidth}%</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedInstance(instance.documentId);
                          setShowModal(true);
                        }}
                        className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-2 rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:-translate-y-0.5 text-sm font-medium"
                      >
                        🔄 Cambiar Template
                      </button>

                      {template !== 'none' && (
                        <button
                          onClick={() => {
                            if (template === 'spam') {
                              router.push('/templates/spam-whatsapp');
                            } else if (template === 'chatbot') {
                              router.push('/templates/chatbot');
                            } else if (template === 'calentamiento') {
                              router.push('/templates/calentamiento');
                            }
                          }}
                          className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 transform hover:-translate-y-0.5 text-sm font-medium"
                        >
                          ⚙️ Configurar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Selección de Template */}
      {showModal && selectedInstance && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl w-full max-w-3xl p-6 border border-slate-100 dark:border-slate-800 transform transition-all scale-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                Selecciona un Template
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {Object.entries(templateInfo).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => handleChangeTemplate(selectedInstance, key)}
                  className={`${info.bgColor} border ${info.borderColor} rounded-2xl p-4 text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5`}
                >
                  <div className="text-3xl mb-3">{info.icon}</div>
                  <h4 className="font-bold text-slate-800 dark:text-white mb-1">{info.name}</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-xs mb-3">{info.description}</p>

                  {key !== 'none' && (
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">CPU:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{info.resources.cpu}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">RAM:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{info.resources.memory}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">BW:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{info.resources.bandwidth}%</span>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 px-4 rounded-xl transition-all font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ManageTemplates() {
  return (
    <Sidebard>
      <ManageTemplatesContent />
    </Sidebard>
  );
}
