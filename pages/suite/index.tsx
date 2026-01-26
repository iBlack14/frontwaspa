import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import { toast } from 'sonner';
import axios from 'axios';
import Sidebard from '../components/dashboard/index';
import {
  CubeIcon,
  PlusIcon,
  TrashIcon,
  PlayIcon,
  StopIcon,
  ArrowTopRightOnSquareIcon,
  CpuChipIcon,
  ServerIcon,
  SignalIcon,
  ClipboardIcon,
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon,
  RocketLaunchIcon,
  BoltIcon,
  StarIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface WorkspaceStruture {
  id: number;
  documentId: string;
  name?: string | null;
  url?: string | null;
  activo?: boolean;
  credencials?: { [key: string]: any } | null;
}

interface ProductField {
  [key: string]: string;
}

interface Product {
  name: string;
  img: string;
  fields: ProductField[];
}

interface ResourceUsage {
  cpu: number;
  memory: {
    usage: number;
    percent: number;
  };
  network: {
    in: number;
    out: number;
  };
}

function DashboardContent() {
  const { session, status } = useAuth();
  const router = useRouter();
  const [workspace, setWorkspaceStruture] = useState<WorkspaceStruture[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceStruture | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formValues, setFormValues] = useState<ProductField>({});
  const [resourceUsage, setResourceUsage] = useState<ResourceUsage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [planLimits, setPlanLimits] = useState<any>(null);
  const [selectedPlanForInstance, setSelectedPlanForInstance] = useState<string>('');

  const [showFields, setShowFields] = useState<{ [key: string]: boolean }>({});

  const toggleShow = (key: string) => {
    setShowFields(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const username = session?.user?.user_metadata?.username || session?.user?.email?.split('@')[0] || 'Usuario';

  const fetchWorkspaces = async () => {
    if (!session?.access_token) return;
    try {
      const { data } = await axios.get(`/api/suite?token=${session.access_token}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!data || !Array.isArray(data) || data.length === 0 || !data[0].suites) {
        console.warn('No workspaces found or invalid structure');
        setWorkspaceStruture([]);
        return;
      }

      const fetchedWorkspaces: WorkspaceStruture[] = data[0].suites.map((item: any) => ({
        id: item.id,
        documentId: item.documentId || item.document_id,
        name: item.name || null,
        url: item.url || '',
        activo: item.activo || false,
        credencials: item.credencials || null,
      }));
      setWorkspaceStruture(fetchedWorkspaces);

      if (selectedWorkspace) {
        const updatedSelectedWorkspace = fetchedWorkspaces.find(
          ws => ws.documentId === selectedWorkspace.documentId
        );
        if (updatedSelectedWorkspace) {
          setSelectedWorkspace(updatedSelectedWorkspace);
        }
      }
    } catch (err: any) {
      console.error('[fetchWorkspaces] Error:', err);
      setError(err.message || 'Error al cargar las sesiones.');
      toast.error('No se pudieron cargar las instancias de Suite');
    }
  };

  const fetchUserPlan = async () => {
    try {
      const res = await axios.get('/api/user/get');
      const plan = res.data.plan_type || 'free';
      setUserPlan(plan);

      const limits = {
        free: { memory: '256M', cpu: 256, workflows: 5, executions: 50, instances: 1 },
        basic: { memory: '512M', cpu: 512, workflows: 10, executions: 100, instances: 1 },
        premium: { memory: '1G', cpu: 1024, workflows: 50, executions: 500, instances: 3 },
        enterprise: { memory: '2G', cpu: 2048, workflows: -1, executions: -1, instances: 10 },
      };
      setPlanLimits(limits[plan as keyof typeof limits] || limits.free);
    } catch (err) {
      console.error('Error fetching user plan:', err);
      setUserPlan('free');
    }
  };

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const { data } = await axios.get('/api/products');
      setProducts(data);
      setError(null);
    } catch (err: any) {
      console.error('[fetchProducts] Error:', err);
      setError(err.message || 'Error al cargar los productos.');
    } finally {
      setLoadingProducts(false);
    }
  };

  const checkInstanceStatus = async (workspace: WorkspaceStruture) => {
    if (!workspace.name) return;

    try {
      console.log(`Checking status for ${workspace.name}...`);

      const response = await axios.post('/api/suite/status', {
        name_service: workspace.name,
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      });

      const statusData = response.data;

      if (statusData.instance_ready && statusData.n8n_ready) {
        toast.success(`¡${workspace.name} está listo y funcionando! 🎉`);
        fetchWorkspaces();
      } else if (statusData.status === 'running' && !statusData.n8n_ready) {
        toast.info(`${workspace.name}: Contenedor activo, N8N inicializando base de datos. ${statusData.note || 'Intenta de nuevo en unos minutos.'}`, {
          duration: 6000
        });
      } else if (statusData.status === 'initializing') {
        toast.info(`${workspace.name}: ${statusData.message || 'Aún se está inicializando...'}`, {
          duration: 5000
        });
      } else if (statusData.status === 'starting') {
        toast.info(`${workspace.name}: Contenedor activo, esperando que N8N esté listo...`, {
          duration: 4000
        });
      } else if (statusData.status === 'dns_error') {
        toast.error(`${workspace.name}: Error de DNS. ${statusData.note || 'Verificar configuración de Easypanel.'}`, {
          duration: 8000
        });
      } else if (statusData.status === 'backend_unavailable') {
        toast.warning(`${workspace.name}: No se pudo verificar con backend. ${statusData.message || ''}`, {
          duration: 6000
        });
      } else {
        toast.info(`${workspace.name}: ${statusData.message || 'Estado desconocido'}`, {
          duration: 4000
        });
      }

    } catch (error: any) {
      console.error(`Status check error:`, error);

      const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';

      if (error.response?.status === 404) {
        toast.error(`${workspace.name}: Instancia no encontrada`);
      } else if (error.response?.status === 403) {
        toast.error(`${workspace.name}: ${error.response.data.message || 'API Key requerida'}`);
      } else if (error.code === 'ECONNABORTED') {
        toast.warning(`${workspace.name}: Verificación tomó demasiado tiempo. Intenta de nuevo.`);
      } else {
        toast.error(`${workspace.name}: Error al verificar estado - ${errorMessage}`);
      }
    }
  };

  const fetchResourceUsage = async () => {
    if (!selectedWorkspace?.name) {
      console.warn('No workspace selected');
      setResourceUsage(null);
      return;
    }

    try {
      const res = await axios.post('/api/suite/usage', {
        name_service: selectedWorkspace.name,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });

      const data = res.data;
      if (data) {
        setResourceUsage({
          cpu: data.cpu || 0,
          memory: {
            usage: data.memory.usage / 1024 / 1024,
            percent: data.memory.percent,
          },
          network: {
            in: data.network.in,
            out: data.network.out,
          },
        });
      } else {
        console.warn('Invalid response structure:', res.data);
        toast.error('Respuesta inválida del servidor');
      }
    } catch (error: any) {
      console.error('Error al cargar uso de recursos:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      toast.error(error.response?.data?.error || 'Error al cargar el uso de recursos');
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchWorkspaces();
      fetchProducts();
      fetchUserPlan();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status]);

  // Auto-check status for initializing instances
  useEffect(() => {
    if (workspace.length === 0) return;

    const initializingInstances = workspace.filter(ws => ws.credencials?.status === 'initializing');

    if (initializingInstances.length === 0) return;

    // Check status every 30 seconds for initializing instances
    const interval = setInterval(() => {
      initializingInstances.forEach(instance => {
        checkInstanceStatus(instance);
      });
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [workspace]);

  useEffect(() => {
    if (selectedWorkspace) {
      fetchResourceUsage();
    } else {
      setResourceUsage(null);
    }
  }, [selectedWorkspace]);

  useEffect(() => {
    if (isModalOpen) {
      const previousActiveElement = document.activeElement as HTMLElement;

      setTimeout(() => {
        const firstInput = document.querySelector<HTMLInputElement>('input[type="text"]');
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleCloseModal();
        }
      };

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          const modal = document.querySelector('[role="dialog"]');
          if (!modal) return;

          const focusableElements = modal.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };

      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleTabKey);

      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('keydown', handleTabKey);
        document.body.style.overflow = 'unset';

        if (previousActiveElement) {
          previousActiveElement.focus();
        }
      };
    }
  }, [isModalOpen]);

  const createNewWorkSpace = async (productName: string, fields: ProductField) => {
    try {
      setIsLoading(true);

      const serviceName = fields.service_name || fields.Service_Name || '';

      if (!serviceName) {
        toast.error('Por favor ingresa un nombre para el servicio');
        setIsLoading(false);
        return;
      }

      if (/[A-Z]/.test(serviceName)) {
        toast.error('El nombre del servicio no debe contener mayúsculas');
        setIsLoading(false);
        return;
      }

      if (serviceName.trim() === 'n8n_free_treal') {
        toast.error('El nombre "n8n_free_treal" está reservado por el sistema');
        setIsLoading(false);
        return;
      }

      if (serviceName.length < 3) {
        toast.error('El nombre del servicio debe tener al menos 3 caracteres');
        setIsLoading(false);
        return;
      }

      if (planLimits && workspace.length >= planLimits.instances) {
        toast.error(`Has alcanzado el límite de ${planLimits.instances} instancia(s) para tu plan ${userPlan}`);
        setIsLoading(false);
        return;
      }

      toast.loading('Creando instancia de n8n...', { id: 'creating' });

      // send session access token if needed for backend validation
      await axios.post(
        '/api/suite/create-n8n',
        {
          service_name: serviceName,
          product_name: productName,
          plan: selectedPlanForInstance
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      toast.success('Instancia N8N creada exitosamente. El contenedor se está configurando.', {
        id: 'creating',
        duration: 8000,
        description: 'N8N inicializará su base de datos (puede tomar varios minutos). El sistema verificará automáticamente cada 30 segundos.'
      });

      fetchWorkspaces();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error al crear nueva instancia:', error.response?.data || error.message);

      const errorData = error.response?.data;
      const isTimeoutError = errorData?.error_type === 'TIMEOUT';
      const suiteWasCreated = errorData?.suite_created === true;

      if (isTimeoutError && suiteWasCreated) {
        toast.success('Instancia creada exitosamente. El contenedor se está configurando.', {
          id: 'creating',
          duration: 8000,
          description: 'Puede tomar unos minutos adicionales. Use el botón de verificación para comprobar el progreso.'
        });
        fetchWorkspaces();
      } else {
        toast.error(errorData?.error || errorData?.message || 'Error al crear nueva instancia', { id: 'creating' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (product: Product) => {
    setSelectedProduct(product);
    const initialValues: ProductField = {};
    product.fields.forEach((field) => {
      Object.entries(field).forEach(([key, value]) => {
        initialValues[key] = value;
      });
    });
    setFormValues(initialValues);
    setSelectedPlanForInstance('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    setFormValues({});
    setSelectedPlanForInstance('');
  };

  const handleConfirm = () => {
    if (!selectedPlanForInstance) {
      toast.error('Por favor selecciona un plan primero');
      return;
    }
    if (selectedProduct) {
      createNewWorkSpace(selectedProduct.name, formValues);
      handleCloseModal();
    } else {
      toast.error('Por favor selecciona un producto.');
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const init = async () => {
    if (!selectedWorkspace || isLoading) return;

    setIsLoading(true);
    try {
      await axios.post('/api/suite/init', {
        token: session?.access_token,
        name_service: selectedWorkspace?.name,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });

      toast.success(`${selectedWorkspace?.name} iniciada con éxito`);

      setSelectedWorkspace(prev => prev ? { ...prev, activo: true } : null);

      setWorkspaceStruture(prev =>
        prev.map(ws =>
          ws.documentId === selectedWorkspace.documentId
            ? { ...ws, activo: true }
            : ws
        )
      );

      fetchWorkspaces();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al inicializar una suite');
    } finally {
      setIsLoading(false);
    }
  };

  const pause = async () => {
    if (!selectedWorkspace || isLoading) return;

    setIsLoading(true);
    try {
      await axios.post('/api/suite/pause', {
        token: session?.access_token,
        name_service: selectedWorkspace?.name,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });

      toast.success(`${selectedWorkspace?.name} pausada con éxito`);

      setSelectedWorkspace(prev => prev ? { ...prev, activo: false } : null);

      setWorkspaceStruture(prev =>
        prev.map(ws =>
          ws.documentId === selectedWorkspace.documentId
            ? { ...ws, activo: false }
            : ws
        )
      );

      fetchWorkspaces();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al pausar una suite');
    } finally {
      setIsLoading(false);
    }
  };

  const dele = async () => {
    if (!selectedWorkspace || isLoading) return;

    setIsLoading(true);
    try {
      await axios.post('/api/suite/delete', {
        token: session?.access_token,
        name_service: selectedWorkspace?.name,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });

      toast.success(`${selectedWorkspace?.name} eliminada con éxito`);

      setWorkspaceStruture(prev =>
        prev.filter(ws => ws.documentId !== selectedWorkspace.documentId)
      );
      setSelectedWorkspace(null);

      fetchWorkspaces();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al eliminar una suite');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-transparent">

      {/* Left Sidebar */}
      <div className="w-80 p-6 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Connect BLXK</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Suite Management</p>
        </div>

        <div className="mb-8">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Bienvenido</p>
            <p className="text-lg font-bold text-slate-800 dark:text-white truncate">{username} 👋</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            Tus Instancias
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors"
            title="Crear nueva instancia"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-red-600 dark:text-red-400 text-xs">{error}</p>
            </div>
          )}

          {workspace.length > 0 ? (
            workspace.map((workspaces) => (
              <button
                key={workspaces.documentId}
                onClick={() => setSelectedWorkspace(workspaces)}
                className={`w-full group flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 ${selectedWorkspace?.documentId === workspaces.documentId
                  ? 'bg-white dark:bg-slate-800 border-2 border-indigo-500 shadow-lg shadow-indigo-500/10'
                  : 'bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md'
                  }`}
              >
                <div className="relative flex-shrink-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${workspaces.activo
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                    : workspaces.credencials?.status === 'initializing'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                    }`}>
                    <CubeIcon className="w-6 h-6" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate ${selectedWorkspace?.documentId === workspaces.documentId
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-700 dark:text-slate-200'
                    }`}>
                    {workspaces.name || 'Sin nombre'}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${workspaces.activo
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : workspaces.credencials?.status === 'initializing'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                      {workspaces.activo
                        ? 'Activo'
                        : workspaces.credencials?.status === 'initializing'
                          ? 'Iniciando'
                          : 'Inactivo'
                      }
                    </span>
                    {workspaces.credencials?.status === 'initializing' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          checkInstanceStatus(workspaces);
                        }}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors animate-pulse"
                        title="Verificar estado - N8N inicializando"
                      >
                        <ArrowPathIcon className="w-3 h-3 animate-spin" />
                      </button>
                    )}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-8 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
              <SparklesIcon className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="text-sm text-slate-500">No tienes instancias</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        {selectedWorkspace ? (
          <div className="max-w-5xl mx-auto animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-3">
                  {selectedWorkspace.name}
                  {selectedWorkspace.activo && (
                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full uppercase tracking-wide">
                      Activo
                    </span>
                  )}
                </h2>
                {selectedWorkspace.url && (
                  <a
                    href={selectedWorkspace.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium"
                  >
                    {selectedWorkspace.url}
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-3">
                {selectedWorkspace.activo ? (
                  <button
                    onClick={pause}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-xl hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors font-medium disabled:opacity-50"
                  >
                    <StopIcon className="w-5 h-5" />
                    {isLoading ? 'Pausando...' : 'Pausar'}
                  </button>
                ) : (
                  <button
                    onClick={init}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors font-medium disabled:opacity-50"
                  >
                    <PlayIcon className="w-5 h-5" />
                    {isLoading ? 'Iniciando...' : 'Iniciar'}
                  </button>
                )}
                <button
                  onClick={dele}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium disabled:opacity-50"
                >
                  <TrashIcon className="w-5 h-5" />
                  {isLoading ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>

            {/* Resource Usage */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                    <CpuChipIcon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-700 dark:text-slate-200">CPU</h3>
                </div>
                <div className="text-3xl font-bold text-slate-800 dark:text-white mb-1">
                  {resourceUsage?.cpu || 0}%
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${resourceUsage?.cpu || 0}%` }}></div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                    <ServerIcon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-700 dark:text-slate-200">Memoria</h3>
                </div>
                <div className="text-3xl font-bold text-slate-800 dark:text-white mb-1">
                  {resourceUsage ? `${resourceUsage.memory.usage.toFixed(0)}MB` : '0MB'}
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 mb-1">
                  <div className="bg-purple-500 h-2 rounded-full transition-all duration-500" style={{ width: `${resourceUsage?.memory.percent || 0}%` }}></div>
                </div>
                <p className="text-xs text-slate-500">{resourceUsage?.memory.percent || 0}% utilizado</p>
              </div>

              <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                    <SignalIcon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-700 dark:text-slate-200">Red</h3>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Entrada</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-white">{resourceUsage?.network.in || 0} KB</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase">Salida</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-white">{resourceUsage?.network.out || 0} KB</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Credentials */}
            {selectedWorkspace.credencials && (
              <div className="bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                    <ClipboardIcon className="w-5 h-5 text-slate-500" />
                    Credenciales de Acceso
                  </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(selectedWorkspace.credencials).map(([key, value]) => (
                    <div key={key} className="group">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        {key.replace(/_/g, ' ')}
                      </label>
                      <div className="relative">
                        <input
                          type={showFields[key] ? 'text' : 'password'}
                          value={value}
                          readOnly
                          className="w-full pl-4 pr-20 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <button
                            onClick={() => toggleShow(key)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                            title={showFields[key] ? 'Ocultar' : 'Mostrar'}
                          >
                            {showFields[key] ? (
                              <EyeSlashIcon className="w-4 h-4" />
                            ) : (
                              <EyeIcon className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(value);
                              toast.success('Copiado al portapapeles');
                            }}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                            title="Copiar"
                          >
                            <ClipboardIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center animate-fadeIn">
            <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-6">
              <RocketLaunchIcon className="w-12 h-12 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              Selecciona una instancia
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
              Elige una instancia del menú lateral para ver sus detalles, métricas y gestionar su estado.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all font-medium"
            >
              Crear Nueva Instancia
            </button>
          </div>
        )}
      </div>

      {/* Modal de Creación */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" role="dialog" aria-modal="true">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-scaleIn">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Nueva Instancia</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Configura tu nuevo servicio</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-8">
                {/* Plan Selection */}
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <BoltIcon className="w-4 h-4" />
                    Selecciona un Plan
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {['basic', 'premium', 'enterprise'].map((plan) => (
                      <button
                        key={plan}
                        onClick={() => setSelectedPlanForInstance(plan)}
                        className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 ${selectedPlanForInstance === plan
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 bg-white dark:bg-slate-800/50'
                          }`}
                      >
                        {selectedPlanForInstance === plan && (
                          <div className="absolute -top-2 -right-2 bg-indigo-500 text-white p-1 rounded-full shadow-sm">
                            <CheckCircleIcon className="w-4 h-4" />
                          </div>
                        )}
                        <div className="mb-2">
                          {plan === 'basic' && <StarIcon className="w-6 h-6 text-slate-400" />}
                          {plan === 'premium' && <SparklesIcon className="w-6 h-6 text-indigo-500" />}
                          {plan === 'enterprise' && <RocketLaunchIcon className="w-6 h-6 text-purple-500" />}
                        </div>
                        <p className="font-bold text-slate-800 dark:text-white capitalize mb-1">{plan}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {plan === 'basic' && 'Para iniciantes'}
                          {plan === 'premium' && 'Para profesionales'}
                          {plan === 'enterprise' && 'Para grandes equipos'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Products */}
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <CubeIcon className="w-4 h-4" />
                    Productos Disponibles
                  </h4>
                  {loadingProducts ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {products.map((product) => (
                        <button
                          key={product.name}
                          onClick={() => handleOpenModal(product)}
                          className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${selectedProduct?.name === product.name
                            ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg'
                            }`}
                        >
                          <div className="aspect-video relative bg-slate-100 dark:bg-slate-800">
                            <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-600">
                              <CubeIcon className="w-12 h-12" />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                              <p className="text-white font-medium">Seleccionar</p>
                            </div>
                          </div>
                          <div className="p-4 bg-white dark:bg-slate-800">
                            <h3 className="font-bold text-slate-800 dark:text-white">{product.name}</h3>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form Fields */}
                {selectedProduct && (
                  <div className="animate-fadeIn">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <ClipboardIcon className="w-4 h-4" />
                      Configuración
                    </h4>
                    <div className="space-y-4">
                      {selectedProduct.fields.map((field, index) => (
                        <div key={index}>
                          {Object.keys(field).map((key) => {
                            if (key === 'service_name' || key === 'Service_Name') return (
                              <div key={key}>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                  Nombre del Servicio <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={formValues[key] || ''}
                                  onChange={(e) => handleInputChange(key, e.target.value)}
                                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                  placeholder="ej: mi-instancia-n8n"
                                />
                                <p className="text-xs text-slate-400 mt-2">
                                  Solo minúsculas, números y guiones bajos. Mínimo 3 caracteres.
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading || !selectedPlanForInstance}
                className="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
              >
                {isLoading ? 'Creando...' : 'Crear Instancia'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <Sidebard>
      <DashboardContent />
    </Sidebard>
  );
}
