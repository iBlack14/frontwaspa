import { SessionProvider, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { toast, Toaster } from 'sonner';
import Sidebard from '../components/dashboard/index';

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
    color: 'zinc',
    resources: { cpu: 0, memory: 0, bandwidth: 0 },
    description: 'Instancia sin automatización',
  },
  spam: {
    name: 'SPAM WhatsApp',
    icon: '📨',
    color: 'emerald',
    resources: { cpu: 30, memory: 50, bandwidth: 80 },
    description: 'Envío masivo de mensajes',
  },
  chatbot: {
    name: 'Chatbot IA',
    icon: '🤖',
    color: 'blue',
    resources: { cpu: 20, memory: 40, bandwidth: 30 },
    description: 'Respuestas automáticas inteligentes',
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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/templates"
                className="text-emerald-500 hover:text-emerald-400 transition"
              >
                ← Volver
              </Link>
              <h1 className="text-2xl font-bold">⚙️ Gestión de Templates</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Resumen de Recursos */}
        <div className="mb-8 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">📊 Uso Total de Recursos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-400 text-sm">CPU</span>
                <span className="text-lg font-bold">{totalResources.cpu}%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(totalResources.cpu, 100)}%` }}
                />
              </div>
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-400 text-sm">Memoria</span>
                <span className="text-lg font-bold">{totalResources.memory}%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(totalResources.memory, 100)}%` }}
                />
              </div>
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-400 text-sm">Ancho de Banda</span>
                <span className="text-lg font-bold">{totalResources.bandwidth}%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(totalResources.bandwidth, 100)}%` }}
                />
              </div>
            </div>
          </div>
          <p className="text-zinc-400 text-sm mt-4">
            💡 Tip: El chatbot consume menos recursos que el spam masivo
          </p>
        </div>

        {/* Comparación de Templates */}
        <div className="mb-8 bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">📋 Comparación de Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(templateInfo).map(([key, info]) => {
              if (key === 'none') return null;
              return (
                <div key={key} className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                  <div className="text-3xl mb-2">{info.icon}</div>
                  <h3 className="font-bold mb-2">{info.name}</h3>
                  <p className="text-zinc-400 text-sm mb-3">{info.description}</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">CPU:</span>
                      <span className={`font-semibold ${info.resources.cpu > 25 ? 'text-yellow-500' : 'text-green-500'}`}>
                        {info.resources.cpu}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Memoria:</span>
                      <span className={`font-semibold ${info.resources.memory > 45 ? 'text-yellow-500' : 'text-green-500'}`}>
                        {info.resources.memory}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Ancho de Banda:</span>
                      <span className={`font-semibold ${info.resources.bandwidth > 50 ? 'text-yellow-500' : 'text-green-500'}`}>
                        {info.resources.bandwidth}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-zinc-700">
                    <span className={`text-xs px-2 py-1 rounded ${
                      info.resources.cpu + info.resources.memory + info.resources.bandwidth < 100
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-yellow-900/30 text-yellow-400'
                    }`}>
                      {info.resources.cpu + info.resources.memory + info.resources.bandwidth < 100
                        ? '⚡ Bajo consumo'
                        : '⚠️ Alto consumo'
                      }
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lista de Instancias */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">📱 Mis Instancias ({instances.length})</h2>
          
          {instances.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <div className="text-5xl mb-4">📱</div>
              <p className="mb-4">No tienes instancias creadas</p>
              <Link
                href="/instances"
                className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-6 rounded-md transition"
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
                    className="bg-zinc-800 border border-zinc-700 rounded-lg p-5 hover:border-zinc-600 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="text-3xl">{info.icon}</div>
                          <div>
                            <h3 className="font-bold text-lg">{instance.name}</h3>
                            <p className="text-zinc-400 text-sm">{instance.phoneNumber || 'Sin número'}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs ${
                            instance.state === 'Connected'
                              ? 'bg-green-900/30 text-green-400'
                              : 'bg-red-900/30 text-red-400'
                          }`}>
                            {instance.state === 'Connected' ? '🟢 Conectada' : '🔴 Desconectada'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-400 text-sm">Template Activo:</span>
                            <span className={`px-3 py-1 rounded text-sm font-semibold bg-${info.color}-900/30 text-${info.color}-400`}>
                              {info.name}
                            </span>
                          </div>
                          
                          {template !== 'none' && (
                            <div className="flex items-center gap-3 text-xs text-zinc-400">
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
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition text-sm"
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
                              }
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md transition text-sm"
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
      </div>

      {/* Modal de Selección de Template */}
      {showModal && selectedInstance && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold mb-4">Selecciona un Template</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {Object.entries(templateInfo).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => handleChangeTemplate(selectedInstance, key)}
                  className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-emerald-500 rounded-lg p-4 text-left transition"
                >
                  <div className="text-3xl mb-2">{info.icon}</div>
                  <h4 className="font-bold mb-1">{info.name}</h4>
                  <p className="text-zinc-400 text-xs mb-3">{info.description}</p>
                  
                  {key !== 'none' && (
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">CPU:</span>
                        <span>{info.resources.cpu}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">RAM:</span>
                        <span>{info.resources.memory}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">BW:</span>
                        <span>{info.resources.bandwidth}%</span>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-4 rounded-md transition"
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
