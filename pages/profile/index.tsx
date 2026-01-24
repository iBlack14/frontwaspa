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
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

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
  const [activeTab, setActiveTab] = useState<'general' | 'proxies' | 'ai'>('general');

  // General tab states
  const [email, setEmail] = useState('');
  const [documentId, setDocumentId] = useState<number | string>('');
  const [username, setUsername] = useState('');
  const [key, setKey] = useState('');
  const [isKeyVisible, setIsKeyVisible] = useState(false);

  // AI config states
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [isOpenaiVisible, setIsOpenaiVisible] = useState(false);
  const [isGeminiVisible, setIsGeminiVisible] = useState(false);

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
        setEmail(userData.email || (session as any)?.email || '');
        setUsername(userData.username || (session as any)?.username || '');
        setDocumentId(userData.documentId || '');
        setKey(userData.key || '');
        setOpenaiKey(userData.openai_api_key || '');
        setGeminiKey(userData.gemini_api_key || '');
      } catch (error: any) {
        console.error('Error al obtener información del usuario:', error);
        if ((session as any)?.email) setEmail((session as any).email);
        if ((session as any)?.username) setUsername((session as any).username);
      }
    };

    if (typedSession?.jwt || session) {
      fetchUserData();
    }
  }, [typedSession, session]);

  const generateKey = () => {
    const newKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setKey(newKey);
  };

  const handleSaveGeneral = async () => {
    try {
      await axios.post('/api/user/update', {
        username,
        key,
        openai_api_key: openaiKey,
        gemini_api_key: geminiKey,
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
      const response = await axios.get(`${backendUrl}/api/proxies`, {
        headers: {
          Authorization: `Bearer ${key}`
        }
      });
      setProxies(response.data.proxies || []);
    } catch (error: any) {
      console.error('Error fetching proxies:', error);
      if (error.response?.status === 401) {
        toast.error('API Key inválida. Por favor genera tu API Key en la sección General.');
      } else {
        toast.error('Error al cargar proxies. Verifica tu conexión.');
      }
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
      const headers = { Authorization: `Bearer ${key}` };

      if (editingProxy) {
        await axios.put(`${backendUrl}/api/proxies/${editingProxy.id}`, proxyFormData, { headers });
        toast.success('Proxy actualizado');
      } else {
        await axios.post(`${backendUrl}/api/proxies`, proxyFormData, { headers });
        toast.success('Proxy creado');
      }

      setShowProxyModal(false);
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
      await axios.delete(`${backendUrl}/api/proxies/${id}`, {
        headers: { Authorization: `Bearer ${key}` }
      });
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
        axios.post(`${backendUrl}/api/proxies/${id}/health-check`, {}, {
          headers: { Authorization: `Bearer ${key}` }
        }),
        {
          loading: 'Verificando proxy...',
          success: (response) => {
            fetchProxies();
            if (response.data.healthy) return 'Proxy saludable ✅';
            throw new Error('Proxy no disponible');
          },
          error: 'Proxy no disponible ❌',
        }
      );
    } catch (error: any) { }
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
      const headers = { Authorization: `Bearer ${key}` };

      for (const instanceId of selectedInstances) {
        await axios.post(`${backendUrl}/api/instance-proxies`, {
          instance_id: instanceId,
          proxy_id: selectedProxyForAssign.id
        }, { headers });
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
      prev.includes(instanceId) ? prev.filter(id => id !== instanceId) : [...prev, instanceId]
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Mi Perfil</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Gestiona tu información personal y configuración de seguridad</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-8 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${activeTab === 'general' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
        >
          <UserIcon className="w-5 h-5" /> Información General
        </button>
        <button
          onClick={() => setActiveTab('proxies')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${activeTab === 'proxies' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
        >
          <ServerIcon className="w-5 h-5" /> Gestión de Proxies
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${activeTab === 'ai' ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
        >
          <SparklesIcon className="w-5 h-5" /> Configuración de IA
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'general' && (
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-8 max-w-2xl">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <ShieldCheckIcon className="w-6 h-6 text-indigo-500" /> Credenciales de Acceso
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Correo Electrónico</label>
                <input type="email" value={email} readOnly className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nombre de Usuario</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">API Secret Key</label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <input type={isKeyVisible ? 'text' : 'password'} value={key} readOnly className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-mono text-sm" />
                    <KeyIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    <button onClick={() => setIsKeyVisible(!isKeyVisible)} className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                      {isKeyVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                  <button onClick={generateKey} className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors flex items-center gap-2 font-medium text-sm">
                    <ArrowPathIcon className="w-5 h-5" /> Generar
                  </button>
                </div>
              </div>
              <div className="pt-4">
                <button onClick={handleSaveGeneral} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3.5 rounded-xl font-bold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">Guardar Cambios</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-8 max-w-2xl">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <SparklesIcon className="w-6 h-6 text-purple-500" /> Configuración de Inteligencia Artificial
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
              Configura tus propias API Keys para habilitar las funciones de IA como el <span className="text-purple-500 font-semibold">Calentamiento con IA</span>.
            </p>
            <div className="space-y-8">
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center"><span className="text-xl">🧠</span></div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">OpenAI (ChatGPT)</h3>
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline">Obtener API Key &rarr;</a>
                  </div>
                </div>
                <div className="relative">
                  <input type={isOpenaiVisible ? 'text' : 'password'} value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} placeholder="sk-..." className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-sm" />
                  <KeyIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                  <button type="button" onClick={() => setIsOpenaiVisible(!isOpenaiVisible)} className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                    {isOpenaiVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center"><span className="text-xl">💎</span></div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">Google Gemini</h3>
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline">Obtener API Key &rarr;</a>
                  </div>
                </div>
                <div className="relative">
                  <input type={isGeminiVisible ? 'text' : 'password'} value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} placeholder="AIza..." className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-sm" />
                  <KeyIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                  <button type="button" onClick={() => setIsGeminiVisible(!isGeminiVisible)} className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                    {isGeminiVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="pt-4">
                <button onClick={handleSaveGeneral} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5">Guardar Configuración IA</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'proxies' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-800/30">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <GlobeAltIcon className="w-6 h-6 text-indigo-500" /> Tus Proxies
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Configura proxies para rotar IPs y evitar bloqueos en tus instancias.</p>
              </div>
              <button onClick={() => openProxyModal()} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg font-medium">
                <PlusIcon className="w-5 h-5" /> Agregar Proxy
              </button>
            </div>

            {loadingProxies ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
                <p className="text-slate-500 dark:text-slate-400">Cargando proxies...</p>
              </div>
            ) : proxies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1e293b] rounded-3xl border border-dashed border-slate-200">
                <ServerIcon className="w-8 h-8 text-slate-400 mb-4" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">No hay proxies configurados</h3>
                <button onClick={() => openProxyModal()} className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Configurar ahora &rarr;</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {proxies.map(proxy => (
                  <div key={proxy.id} className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${proxy.is_healthy ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}><ServerIcon className="w-6 h-6" /></div>
                        <div><h3 className="font-bold text-slate-800 dark:text-white">{proxy.name}</h3><span className="text-xs text-slate-400 uppercase">{proxy.type}</span></div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${proxy.is_healthy ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                    </div>
                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex justify-between"><span>Host</span><span className="font-mono">{proxy.host}</span></div>
                      <div className="flex justify-between"><span>Puerto</span><span className="font-mono">{proxy.port}</span></div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openAssignModal(proxy)} className="flex-1 bg-indigo-50 text-indigo-600 py-2 rounded-xl text-sm font-medium">Asignar</button>
                      <button onClick={() => handleHealthCheck(proxy.id)} className="p-2 bg-slate-50 rounded-xl"><ArrowPathIcon className="w-4 h-4" /></button>
                      <button onClick={() => openProxyModal(proxy)} className="p-2 bg-slate-50 rounded-xl"><PencilIcon className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteProxy(proxy.id)} className="p-2 bg-red-50 text-red-600 rounded-xl"><TrashIcon className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-100 overflow-y-auto max-h-[85vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Asignar Proxy</h3>
              <button onClick={() => setShowAssignModal(false)}><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="mb-6 p-4 bg-indigo-50 rounded-2xl">
              <p className="text-sm">Proxy: <span className="font-bold">{selectedProxyForAssign?.name}</span></p>
            </div>
            <div className="space-y-2 mb-8">
              {instances.map(inst => (
                <label key={inst.documentId} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer ${selectedInstances.includes(inst.documentId) ? 'bg-indigo-50 border-indigo-200' : ''}`}>
                  <input type="checkbox" checked={selectedInstances.includes(inst.documentId)} onChange={() => toggleInstanceSelection(inst.documentId)} className="w-5 h-5" />
                  <div className="flex-1"><p className="font-bold text-sm">{inst.name || 'Instancia'}</p><p className="text-xs">{inst.phoneNumber || inst.documentId}</p></div>
                </label>
              ))}
            </div>
            <button onClick={handleAssignProxy} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold">Asignar ({selectedInstances.length})</button>
          </div>
        </div>
      )}

      {showProxyModal && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-100 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{editingProxy ? 'Editar Proxy' : 'Nuevo Proxy'}</h3>
              <button onClick={() => setShowProxyModal(false)}><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmitProxy} className="space-y-4">
              <input type="text" value={proxyFormData.name} onChange={e => setProxyFormData({ ...proxyFormData, name: e.target.value })} placeholder="Nombre" className="w-full px-4 py-3 border rounded-xl" required />
              <div className="grid grid-cols-3 gap-4">
                <select value={proxyFormData.type} onChange={e => setProxyFormData({ ...proxyFormData, type: e.target.value as any })} className="border rounded-xl px-2"><option value="http">HTTP</option><option value="https">HTTPS</option><option value="socks4">SOCKS4</option><option value="socks5">SOCKS5</option></select>
                <input type="text" value={proxyFormData.host} onChange={e => setProxyFormData({ ...proxyFormData, host: e.target.value })} placeholder="Host" className="col-span-2 px-4 py-3 border rounded-xl" required />
              </div>
              <input type="number" value={proxyFormData.port} onChange={e => setProxyFormData({ ...proxyFormData, port: parseInt(e.target.value) })} placeholder="Puerto" className="w-full px-4 py-3 border rounded-xl" required />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowProxyModal(false)} className="flex-1 py-3 border rounded-xl">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">Guardar</button>
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
