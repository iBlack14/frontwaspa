'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Sidebard from '../components/dashboard/index';
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
  ServerIcon
} from '@heroicons/react/24/outline';
import { Toaster, toast } from 'sonner';

interface CustomSession {
  id?: string;
  jwt?: string;
  firstName?: string;
}

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
  const [activeTab, setActiveTab] = useState<'general' | 'proxy' | 'proxies'>('general');

  // General tab states
  const [email, setEmail] = useState('');
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [username, setUsername] = useState('');
  const [key, setKey] = useState('');
  const [isKeyVisible, setIsKeyVisible] = useState(false);

  // Proxy tab states
  const [loadingProxy, setLoadingProxy] = useState(true);
  const [savingProxy, setSavingProxy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [proxyConfig, setProxyConfig] = useState<ProxyConfig>({
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
        toast.error('Error al cargar datos del perfil');
      }
    };

    if (typedSession?.jwt) {
      fetchUserData();
    }
  }, [typedSession]);

  // Load proxy config
  useEffect(() => {
    const loadProxyConfig = async () => {
      try {
        const res = await axios.get('/api/settings/proxy');
        if (res.data.success) {
          setProxyConfig({
            proxy_enabled: res.data.config.proxy_enabled || false,
            proxy_type: res.data.config.proxy_type || 'http',
            proxy_host: res.data.config.proxy_host || '',
            proxy_port: res.data.config.proxy_port || null,
            proxy_username: res.data.config.proxy_username || '',
            proxy_password: '',
            proxy_country: res.data.config.proxy_country || '',
            proxy_rotation: res.data.config.proxy_rotation || false,
            proxy_rotation_minutes: res.data.config.proxy_rotation_minutes || 30,
          });
        }
      } catch (error: any) {
        console.error('Error cargando proxy:', error);
      } finally {
        setLoadingProxy(false);
      }
    };

    if (activeTab === 'proxy') {
      loadProxyConfig();
    }
  }, [activeTab]);

  const generateKey = () => {
    const newKey = Math.random().toString(36).substring(2, 15);
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

  const handleSaveProxy = async () => {
    if (proxyConfig.proxy_enabled) {
      if (!proxyConfig.proxy_host.trim()) {
        toast.error('El host del proxy es requerido');
        return;
      }
      if (!proxyConfig.proxy_port || proxyConfig.proxy_port < 1 || proxyConfig.proxy_port > 65535) {
        toast.error('El puerto debe estar entre 1 y 65535');
        return;
      }
    }

    setSavingProxy(true);
    try {
      const res = await axios.put('/api/settings/proxy', proxyConfig);
      if (res.data.success) {
        toast.success('Configuración de proxy guardada');
        setTestResult(null);
      }
    } catch (error: any) {
      console.error('Error guardando proxy:', error);
      toast.error(error.response?.data?.error || 'Error al guardar');
    } finally {
      setSavingProxy(false);
    }
  };

  const handleTestProxy = async () => {
    if (!proxyConfig.proxy_host.trim() || !proxyConfig.proxy_port) {
      toast.error('Configura host y puerto antes de probar');
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const res = await axios.post('/api/settings/proxy/test', proxyConfig);
      if (res.data.success) {
        setTestResult({
          success: true,
          message: `✅ Proxy funcional! IP: ${res.data.ip} | Ubicación: ${res.data.location}`,
        });
        toast.success('Proxy funciona correctamente');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'No se pudo conectar';
      setTestResult({
        success: false,
        message: `❌ Error: ${errorMsg}`,
      });
      toast.error('El proxy no funciona');
    } finally {
      setTesting(false);
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
      const response = await axios.get(`${backendUrl}/api/proxies`);
      setProxies(response.data.proxies || []);
    } catch (error: any) {
      console.error('Error fetching proxies:', error);
      toast.error('Error al cargar proxies');
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
      toast.info('Verificando proxy...');
      const response = await axios.post(`${backendUrl}/api/proxies/${id}/health-check`);
      
      if (response.data.healthy) {
        toast.success('Proxy saludable ✅');
      } else {
        toast.error('Proxy no disponible ❌');
      }
      
      fetchProxies();
    } catch (error: any) {
      toast.error('Error al verificar proxy');
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-900 dark:text-white">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <Toaster richColors position="top-right" />

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Mi Perfil
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-zinc-400">
          Gestiona tu información personal y configuración de seguridad
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-zinc-700 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'general'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-zinc-400 dark:hover:text-zinc-300'
            }`}
          >
            <UserIcon className="w-5 h-5" />
            Información General
          </button>
          <button
            onClick={() => setActiveTab('proxy')}
            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'proxy'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-zinc-400 dark:hover:text-zinc-300'
            }`}
          >
            <ShieldCheckIcon className="w-5 h-5" />
            Configuración de Proxy
          </button>
          <button
            onClick={() => setActiveTab('proxies')}
            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'proxies'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-zinc-400 dark:hover:text-zinc-300'
            }`}
          >
            <ServerIcon className="w-5 h-5" />
            Gestión de Proxies
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-800 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Datos de Usuario
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 dark:text-zinc-400 font-medium mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                readOnly
                className="p-3 w-full text-gray-600 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-zinc-400 font-medium mb-1">
                Nombre de Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nombre de usuario"
                className="p-3 w-full text-gray-900 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-zinc-400 font-medium mb-1">
                Secret Key
              </label>
              <div className="flex items-center space-x-2">
                <div className="relative w-full">
                  <input
                    type={isKeyVisible ? 'text' : 'password'}
                    value={key}
                    readOnly
                    className="p-3 w-full text-gray-600 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-lg focus:outline-none pr-10"
                  />
                  <div className="absolute inset-y-0 right-2 flex items-center">
                    <button
                      onClick={() => setIsKeyVisible(!isKeyVisible)}
                      className="text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      {isKeyVisible ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                <button
                  onClick={generateKey}
                  className="bg-amber-600 text-white px-4 py-3 rounded-lg hover:bg-amber-700 transition flex items-center space-x-2 whitespace-nowrap"
                >
                  <KeyIcon className="w-5 h-5" />
                  <span>Generar</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleSaveGeneral}
              className="bg-emerald-600 text-white px-6 py-3 w-full rounded-lg hover:bg-emerald-700 transition mt-6 font-medium"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      )}

      {activeTab === 'proxy' && (
        <div className="space-y-6">
          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
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
                  checked={proxyConfig.proxy_enabled}
                  onChange={(e) => setProxyConfig({ ...proxyConfig, proxy_enabled: e.target.checked })}
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
                value={proxyConfig.proxy_type}
                onChange={(e) => setProxyConfig({ ...proxyConfig, proxy_type: e.target.value as any })}
                disabled={!proxyConfig.proxy_enabled}
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
                  value={proxyConfig.proxy_host}
                  onChange={(e) => setProxyConfig({ ...proxyConfig, proxy_host: e.target.value })}
                  disabled={!proxyConfig.proxy_enabled}
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
                  value={proxyConfig.proxy_port || ''}
                  onChange={(e) => setProxyConfig({ ...proxyConfig, proxy_port: parseInt(e.target.value) || null })}
                  disabled={!proxyConfig.proxy_enabled}
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
                  value={proxyConfig.proxy_username}
                  onChange={(e) => setProxyConfig({ ...proxyConfig, proxy_username: e.target.value })}
                  disabled={!proxyConfig.proxy_enabled}
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
                  value={proxyConfig.proxy_password}
                  onChange={(e) => setProxyConfig({ ...proxyConfig, proxy_password: e.target.value })}
                  disabled={!proxyConfig.proxy_enabled}
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
                value={proxyConfig.proxy_country}
                onChange={(e) => setProxyConfig({ ...proxyConfig, proxy_country: e.target.value })}
                disabled={!proxyConfig.proxy_enabled}
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
                    checked={proxyConfig.proxy_rotation}
                    onChange={(e) => setProxyConfig({ ...proxyConfig, proxy_rotation: e.target.checked })}
                    disabled={!proxyConfig.proxy_enabled}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {proxyConfig.proxy_rotation && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Rotar cada (minutos)
                  </label>
                  <input
                    type="number"
                    value={proxyConfig.proxy_rotation_minutes}
                    onChange={(e) => setProxyConfig({ ...proxyConfig, proxy_rotation_minutes: parseInt(e.target.value) || 30 })}
                    disabled={!proxyConfig.proxy_enabled}
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
                onClick={handleTestProxy}
                disabled={!proxyConfig.proxy_enabled || testing || !proxyConfig.proxy_host || !proxyConfig.proxy_port}
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
                onClick={handleSaveProxy}
                disabled={savingProxy}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                {savingProxy ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proxies Management Tab */}
      {activeTab === 'proxies' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Gestión de Proxies</h2>
              <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
                Administra tus proxies para evitar bloqueos
              </p>
            </div>
            <button
              onClick={() => openProxyModal()}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition"
            >
              <PlusIcon className="w-5 h-5" />
              Agregar Proxy
            </button>
          </div>

          {loadingProxies ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando proxies...</p>
            </div>
          ) : proxies.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400 mb-4">No tienes proxies configurados</p>
              <button
                onClick={() => openProxyModal()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition"
              >
                Agregar tu primer proxy
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {proxies.map((proxy) => (
                <div
                  key={proxy.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      {proxy.is_healthy ? (
                        <CheckCircleIcon className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircleIcon className="w-6 h-6 text-red-500" />
                      )}
                      <h3 className="font-semibold text-gray-900 dark:text-white">{proxy.name}</h3>
                    </div>
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {proxy.type.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p>
                      <span className="font-medium">Host:</span> {proxy.host}:{proxy.port}
                    </p>
                    {proxy.country && (
                      <p>
                        <span className="font-medium">Ubicación:</span> {proxy.city}, {proxy.country}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Uso:</span> {proxy.usage_count} instancia(s)
                    </p>
                    {proxy.last_health_check && (
                      <p className="text-xs">
                        Último check: {new Date(proxy.last_health_check).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <button
                      onClick={() => openAssignModal(proxy)}
                      className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-3 py-2 rounded transition"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Asignar
                    </button>
                    <button
                      onClick={() => handleHealthCheck(proxy.id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2 rounded transition"
                    >
                      Test
                    </button>
                    <button
                      onClick={() => openProxyModal(proxy)}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm px-3 py-2 rounded transition"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteProxy(proxy.id)}
                      className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-2 rounded transition"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Asignar Proxy */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Asignar Proxy: {selectedProxyForAssign?.name}
            </h2>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Selecciona las instancias a las que deseas asignar este proxy:
            </p>

            {instances.length === 0 ? (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                No tienes instancias disponibles
              </div>
            ) : (
              <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
                {instances.map((instance) => (
                  <label
                    key={instance.document_id}
                    className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedInstances.includes(instance.document_id)}
                      onChange={() => toggleInstanceSelection(instance.document_id)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {instance.profile_name || 'Instancia'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {instance.phone_number || instance.document_id}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      instance.state === 'Connected' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {instance.state}
                    </span>
                  </label>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedProxyForAssign(null);
                  setSelectedInstances([]);
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignProxy}
                disabled={selectedInstances.length === 0}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Asignar ({selectedInstances.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear/Editar Proxy */}
      {showProxyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              {editingProxy ? 'Editar Proxy' : 'Nuevo Proxy'}
            </h2>
            
            <form onSubmit={handleSubmitProxy} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={proxyFormData.name}
                  onChange={(e) => setProxyFormData({ ...proxyFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo
                </label>
                <select
                  value={proxyFormData.type}
                  onChange={(e) => setProxyFormData({ ...proxyFormData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="http">HTTP</option>
                  <option value="https">HTTPS</option>
                  <option value="socks4">SOCKS4</option>
                  <option value="socks5">SOCKS5</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Host
                  </label>
                  <input
                    type="text"
                    value={proxyFormData.host}
                    onChange={(e) => setProxyFormData({ ...proxyFormData, host: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Puerto
                  </label>
                  <input
                    type="number"
                    value={proxyFormData.port}
                    onChange={(e) => setProxyFormData({ ...proxyFormData, port: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Usuario (opcional)
                  </label>
                  <input
                    type="text"
                    value={proxyFormData.username}
                    onChange={(e) => setProxyFormData({ ...proxyFormData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contraseña (opcional)
                  </label>
                  <input
                    type="password"
                    value={proxyFormData.password}
                    onChange={(e) => setProxyFormData({ ...proxyFormData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    País (opcional)
                  </label>
                  <input
                    type="text"
                    value={proxyFormData.country}
                    onChange={(e) => setProxyFormData({ ...proxyFormData, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ciudad (opcional)
                  </label>
                  <input
                    type="text"
                    value={proxyFormData.city}
                    onChange={(e) => setProxyFormData({ ...proxyFormData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowProxyModal(false);
                    resetProxyForm();
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition"
                >
                  {editingProxy ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <Sidebard>
      <ProfilePage />
    </Sidebard>
  );
}
