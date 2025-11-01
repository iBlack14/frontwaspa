import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast, Toaster } from 'sonner';
import Sidebar from '../components/dashboard/index';
import { PlusIcon, TrashIcon, CheckCircleIcon, XCircleIcon, LinkIcon } from '@heroicons/react/24/outline';

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

function ProxiesContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProxy, setEditingProxy] = useState<Proxy | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProxyForAssign, setSelectedProxyForAssign] = useState<Proxy | null>(null);
  const [instances, setInstances] = useState<any[]>([]);
  const [selectedInstances, setSelectedInstances] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
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

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProxies();
      fetchInstances();
    }
  }, [status]);

  const fetchProxies = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await axios.get(`${backendUrl}/api/proxies`);
      setProxies(response.data.proxies || []);
    } catch (error: any) {
      console.error('Error fetching proxies:', error);
      toast.error('Error al cargar proxies');
    } finally {
      setLoading(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      
      if (editingProxy) {
        await axios.put(`${backendUrl}/api/proxies/${editingProxy.id}`, formData);
        toast.success('Proxy actualizado');
      } else {
        await axios.post(`${backendUrl}/api/proxies`, formData);
        toast.success('Proxy creado');
      }
      
      setShowModal(false);
      setEditingProxy(null);
      resetForm();
      fetchProxies();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar proxy');
    }
  };

  const handleDelete = async (id: string) => {
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

  const openModal = (proxy?: Proxy) => {
    if (proxy) {
      setEditingProxy(proxy);
      setFormData({
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
      resetForm();
    }
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando proxies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <Toaster richColors position="top-right" />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Gestión de Proxies</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Administra tus proxies para evitar bloqueos
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition"
        >
          <PlusIcon className="w-5 h-5" />
          Agregar Proxy
        </button>
      </div>

      {proxies.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No tienes proxies configurados</p>
          <button
            onClick={() => openModal()}
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
                  onClick={() => openModal(proxy)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm px-3 py-2 rounded transition"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(proxy.id)}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-2 rounded transition"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
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

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              {editingProxy ? 'Editar Proxy' : 'Nuevo Proxy'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
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
                    value={formData.host}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
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
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
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
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contraseña (opcional)
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ciudad (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
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

export default function ProxiesPage() {
  return (
    <Sidebar>
      <ProxiesContent />
    </Sidebar>
  );
}
