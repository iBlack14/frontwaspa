'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Sidebar from '../components/dashboard/index';
import {
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  UserIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  TrashIcon,
  LinkIcon,
  ServerIcon,
  PencilIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Toaster, toast } from 'sonner';

interface CustomSession {
  id?: string;
  jwt?: string;
  firstName?: string;
}

interface Proxy {
  id: string;
  name: string;
  type: 'http' | 'https' | 'socks4' | 'socks5';
  host: string;
  port: number;
  username?: string;
  password?: string;
  country?: string;
  city?: string;
  is_active: boolean;
  is_healthy: boolean;
  last_health_check?: string;
  health_check_error?: string;
  usage_count: number;
}

function ProfilePage() {
  const { data: session, status } = useSession();
  const typedSession = session as CustomSession | null;
  const router = useRouter();

  // Tab state
  const [activeTab, setActiveTab] = useState<'general' | 'proxies'>('general');

  // General tab states
  const [email, setEmail] = useState('');
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [username, setUsername] = useState('');
  const [key, setKey] = useState('');
  const [isKeyVisible, setIsKeyVisible] = useState(false);

  // Proxies management tab states
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [loadingProxies, setLoadingProxies] = useState(true);
  const [showProxyModal, setShowProxyModal] = useState(false);
  const [editingProxy, setEditingProxy] = useState<Proxy | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProxyForAssign, setSelectedProxyForAssign] = useState<Proxy | null>(null);
  const [instances, setInstances] = useState<any[]>([]);
  const [selectedInstances, setSelectedInstances] = useState<string[]>([]);

  const [proxyFormData, setProxyFormData] = useState({
    name: '',
    type: 'http' as 'http' | 'https' | 'socks4' | 'socks5',
    host: '',
    port: 8080,
    username: '',
    password: '',
    country: '',
    city: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Load user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.post('/api/user/get', {
          jwt: typedSession?.jwt,
        });

        const userData = response.data;
        setEmail(userData.email || '');
        setUsername(userData.username || '');
        setDocumentId(userData.documentId || '');
        setKey(userData.key || '');
      } catch (error: any) {
        console.error('Error al obtener información del usuario:', error);
        // toast.error('Error al cargar datos del perfil');
      }
    };

    if (typedSession?.jwt) {
      fetchUserData();
    }
  }, [typedSession]);


  const generateKey = () => {
    const newKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setKey(newKey);
  };

  const handleSaveGeneral = async () => {
    try {
      await axios.post('/api/user/update', {
        username,
        key,
        jwt: typedSession?.jwt,
      });

      toast.success('Información actualizada con éxito');
    } catch (error: any) {
      console.error('Error al actualizar:', error);
      toast.error('Error al actualizar la información');
    }
  };

  // Proxies management functions
  useEffect(() => {
    if (activeTab === 'proxies' && status === 'authenticated') {
      fetchProxies();
      fetchInstances();
    }
  }, [activeTab, status]);

  const fetchProxies = async () => {
    try {
      setLoadingProxies(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) {
        toast.error('Error de configuración: Backend URL no definida');
        return;
      }
      const response = await axios.get(`${backendUrl}/api/proxies`);
      setProxies(response.data.proxies || []);
    } catch (error: any) {
      console.error('Error fetching proxies:', error);
      toast.error('Error al cargar proxies. Verifica tu conexión.');
    } finally {
      setLoadingProxies(false);
    }
  };

  const fetchInstances = async () => {
    try {
      const response = await axios.get('/api/instances');
      setInstances(response.data.instances || []);
    } catch (error: any) {
      console.error('Error fetching instances:', error);
    }
  };

  const handleSubmitProxy = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

      if (editingProxy) {
        await axios.put(`${backendUrl}/api/proxies/${editingProxy.id}`, proxyFormData);
        toast.success('Proxy actualizado');
      } else {
        await axios.post(`${backendUrl}/api/proxies`, proxyFormData);
        toast.success('Proxy creado');
      }

      setShowProxyModal(false);
      setEditingProxy(null);
      resetProxyForm();
      fetchProxies();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar proxy');
    }
  };

  const handleDeleteProxy = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este proxy?')) return;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      await axios.delete(`${backendUrl}/api/proxies/${id}`);
      toast.success('Proxy eliminado');
      fetchProxies();
    } catch (error: any) {
      toast.error('Error al eliminar proxy');
    }
  };

  const handleHealthCheck = async (id: string) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      toast.promise(
        axios.post(`${backendUrl}/api/proxies/${id}/health-check`),
        {
          loading: 'Verificando proxy...',
          success: (response) => {
            if (response.data.healthy) {
              fetchProxies();
              return 'Proxy saludable ✅';
            } else {
              fetchProxies();
              throw new Error('Proxy no disponible');
            }
          },
          error: 'Proxy no disponible ❌',
        }
      );
    } catch (error: any) {
      // Handled by toast.promise
    }
  };

  const openProxyModal = (proxy?: Proxy) => {
    if (proxy) {
      setEditingProxy(proxy);
      setProxyFormData({
        name: proxy.name,
        type: proxy.type,
        host: proxy.host,
        port: proxy.port,
        username: proxy.username || '',
        password: proxy.password || '',
        country: proxy.country || '',
        city: proxy.city || '',
      });
    } else {
      resetProxyForm();
    }
    setShowProxyModal(true);
  };

  const resetProxyForm = () => {
    setProxyFormData({
      name: '',
      type: 'http',
      host: '',
      port: 8080,
      username: '',
      password: '',
      country: '',
      city: '',
    });
    setEditingProxy(null);
  };

  const openAssignModal = (proxy: Proxy) => {
    setSelectedProxyForAssign(proxy);
    setSelectedInstances([]);
    setShowAssignModal(true);
  };

  const handleAssignProxy = async () => {
    if (!selectedProxyForAssign || selectedInstances.length === 0) {
      toast.error('Selecciona al menos una instancia');
      return;
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

      for (const instanceId of selectedInstances) {
        await axios.post(`${backendUrl}/api/instance-proxies`, {
          instance_id: instanceId,
          proxy_id: selectedProxyForAssign.id
        });
      }

      toast.success(`Proxy asignado a ${selectedInstances.length} instancia(s)`);
      setShowAssignModal(false);
      setSelectedProxyForAssign(null);
      setSelectedInstances([]);
      fetchProxies();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al asignar proxy');
    }
  };

  const toggleInstanceSelection = (instanceId: string) => {
    setSelectedInstances(prev =>
      prev.includes(instanceId)
        ? prev.filter(id => id !== instanceId)
        : [...prev, instanceId]
    );
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-transparent">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 sm:p-8">
      <Toaster richColors position="top-right" />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
          Mi Perfil
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Gestiona tu información personal y configuración de seguridad
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-8 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${activeTab === 'general'
            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
        >
          <UserIcon className="w-5 h-5" />
          Información General
        </button>
        <button
          onClick={() => setActiveTab('proxies')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${activeTab === 'proxies'
            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
        >
          <ServerIcon className="w-5 h-5" />
          Gestión de Proxies
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-8 max-w-2xl">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <ShieldCheckIcon className="w-6 h-6 text-indigo-500" />
            Credenciales de Acceso
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full pl-4 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 focus:outline-none cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nombre de Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                API Secret Key
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    type={isKeyVisible ? 'text' : 'password'}
                    value={key}
                    readOnly
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-mono text-sm focus:outline-none"
                  />
                  <KeyIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                  <button
                    onClick={() => setIsKeyVisible(!isKeyVisible)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {isKeyVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
                <button
                  onClick={generateKey}
                  className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors flex items-center gap-2 font-medium text-sm"
                  title="Generar nueva clave"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                  Generar
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Esta clave se utiliza para autenticar tus peticiones a la API. No la compartas.
              </p>
            </div>

            <div className="pt-4">
              <button
                onClick={handleSaveGeneral}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proxies Management Tab */}
      {activeTab === 'proxies' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-800/30">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <GlobeAltIcon className="w-6 h-6 text-indigo-500" />
                Tus Proxies
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Configura proxies para rotar IPs y evitar bloqueos en tus instancias.
              </p>
            </div>
            <button
              onClick={() => openProxyModal()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 font-medium"
            >
              <PlusIcon className="w-5 h-5" />
              Agregar Proxy
            </button>
          </div>

          {loadingProxies ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
              <p className="text-slate-500 dark:text-slate-400">Cargando proxies...</p>
            </div>
          ) : proxies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-100 dark:border-slate-800 border-dashed">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <ServerIcon className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">No hay proxies configurados</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6 text-center max-w-md">
                Agrega tu primer proxy para mejorar la conectividad y seguridad de tus instancias.
              </p>
              <button
                onClick={() => openProxyModal()}
                className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
              >
                Configurar ahora &rarr;
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {proxies.map((proxy) => (
                <div
                  key={proxy.id}
                  className="group bg-white dark:bg-[#1e293b] rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${proxy.is_healthy
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                        : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                        <ServerIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white">{proxy.name}</h3>
                        <span className="text-xs font-mono text-slate-400 uppercase">{proxy.type}</span>
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${proxy.is_healthy ? 'bg-emerald-500' : 'bg-red-500'}`} title={proxy.is_healthy ? 'Online' : 'Offline'}></div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Host</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{proxy.host}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Puerto</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{proxy.port}</span>
                    </div>
                    {proxy.country && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Ubicación</span>
                        <span className="text-slate-700 dark:text-slate-300">{proxy.city}, {proxy.country}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Uso</span>
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs font-medium text-slate-600 dark:text-slate-300">
                        {proxy.usage_count} instancias
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => openAssignModal(proxy)}
                      className="col-span-2 flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 py-2 rounded-xl text-sm font-medium transition-colors"
                      title="Asignar a instancias"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Asignar
                    </button>
                    <button
                      onClick={() => handleHealthCheck(proxy.id)}
                      className="flex items-center justify-center bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 py-2 rounded-xl transition-colors"
                      title="Verificar estado"
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openProxyModal(proxy)}
                      className="flex items-center justify-center bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 py-2 rounded-xl transition-colors"
                      title="Editar"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    {/* <button
                      onClick={() => handleDeleteProxy(proxy.id)}
                      className="flex items-center justify-center bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 py-2 rounded-xl transition-colors"
                      title="Eliminar"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button> */}
                  </div>
                  <button
                    onClick={() => handleDeleteProxy(proxy.id)}
                    className="w-full mt-2 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 py-2 rounded-xl text-sm font-medium transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Eliminar Proxy
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Asignar Proxy */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-800 transform transition-all scale-100 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                Asignar Proxy
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
              <p className="text-sm font-medium text-indigo-900 dark:text-indigo-300">Proxy seleccionado:</p>
              <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{selectedProxyForAssign?.name}</p>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Selecciona las instancias a las que deseas asignar este proxy:
            </p>

            {instances.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No tienes instancias disponibles
              </div>
            ) : (
              <div className="space-y-2 mb-8">
                {instances.map((instance) => (
                  <label
                    key={instance.documentId}
                    className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${selectedInstances.includes(instance.documentId)
                      ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800'
                      : 'bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedInstances.includes(instance.documentId)}
                      onChange={() => toggleInstanceSelection(instance.documentId)}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 dark:text-white text-sm">
                        {instance.name || 'Instancia'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {instance.phoneNumber || instance.documentId}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${instance.state === 'Connected'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                      }`}>
                      {instance.state}
                    </span>
                  </label>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 py-3 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignProxy}
                disabled={selectedInstances.length === 0}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
              >
                Asignar ({selectedInstances.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear/Editar Proxy */}
      {showProxyModal && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-800 transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                {editingProxy ? 'Editar Proxy' : 'Nuevo Proxy'}
              </h3>
              <button
                onClick={() => setShowProxyModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmitProxy} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Identificativo
                </label>
                <input
                  type="text"
                  value={proxyFormData.name}
                  onChange={(e) => setProxyFormData({ ...proxyFormData, name: e.target.value })}
                  placeholder="Ej: Proxy USA Premium"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tipo
                  </label>
                  <select
                    value={proxyFormData.type}
                    onChange={(e) => setProxyFormData({ ...proxyFormData, type: e.target.value as any })}
                    className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="http">HTTP</option>
                    <option value="https">HTTPS</option>
                    <option value="socks4">SOCKS4</option>
                    <option value="socks5">SOCKS5</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Host / IP
                  </label>
                  <input
                    type="text"
                    value={proxyFormData.host}
                    onChange={(e) => setProxyFormData({ ...proxyFormData, host: e.target.value })}
                    placeholder="192.168.1.1"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Puerto
                </label>
                <input
                  type="number"
                  value={proxyFormData.port}
                  onChange={(e) => setProxyFormData({ ...proxyFormData, port: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Usuario (Opcional)
                  </label>
                  <input
                    type="text"
                    value={proxyFormData.username}
                    onChange={(e) => setProxyFormData({ ...proxyFormData, username: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Contraseña (Opcional)
                  </label>
                  <input
                    type="password"
                    value={proxyFormData.password}
                    onChange={(e) => setProxyFormData({ ...proxyFormData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    País (Opcional)
                  </label>
                  <input
                    type="text"
                    value={proxyFormData.country}
                    onChange={(e) => setProxyFormData({ ...proxyFormData, country: e.target.value })}
                    placeholder="Ej: US"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Ciudad (Opcional)
                  </label>
                  <input
                    type="text"
                    value={proxyFormData.city}
                    onChange={(e) => setProxyFormData({ ...proxyFormData, city: e.target.value })}
                    placeholder="Ej: New York"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowProxyModal(false)}
                  className="flex-1 py-3 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                >
                  {editingProxy ? 'Guardar Cambios' : 'Crear Proxy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  return (
    <Sidebar>
      <ProfilePage />
    </Sidebar>
  );
}
