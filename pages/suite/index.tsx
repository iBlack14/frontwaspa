import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { toast } from 'sonner';
import axios from 'axios';
import Sidebard from '../../components/dashboard/index';
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
  ArrowPathIcon,
  XMarkIcon,
  ChevronRightIcon
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

const planData = {
  basic: {
    name: 'Basic',
    price: 'S/49',
    memory: '512MB',
    cpu: '0.5 vCPU',
    features: ['5 workflows', '100 executions/mes', 'Soporte email']
  },
  premium: {
    name: 'Premium',
    price: 'S/99',
    memory: '1GB',
    cpu: '1 vCPU',
    features: ['50 workflows', '500 executions/mes', 'Soporte prioritario'],
    popular: true
  },
  enterprise: {
    name: 'Enterprise',
    price: 'S/299',
    memory: '2GB',
    cpu: '2 vCPU',
    features: ['Workflows ilimitados', 'Executions ilimitadas', 'Account Manager']
  }
};

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
  const [modalStep, setModalStep] = useState<number>(1);
  const [showFields, setShowFields] = useState<{ [key: string]: boolean }>({});

  const toggleShow = (key: string) => {
    setShowFields(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const username = session?.user?.user_metadata?.username || session?.user?.email?.split('@')[0] || 'Usuario';

  const fetchWorkspaces = async () => {
    if (!session?.access_token) return;
    try {
      const { data } = await axios.get(`/api/suite?token=${session.access_token}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!data || !Array.isArray(data) || data.length === 0 || !data[0].suites) {
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
      setError(err.message || 'Error al cargar las sesiones.');
      toast.error('No se pudieron cargar las instancias');
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
      setError(err.message || 'Error al cargar los productos.');
    } finally {
      setLoadingProducts(false);
    }
  };

  const checkInstanceStatus = async (workspace: WorkspaceStruture) => {
    if (!workspace.name) return;

    try {
      const response = await axios.post('/api/suite/status', {
        name_service: workspace.name,
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      });

      const statusData = response.data;

      if (statusData.instance_ready && statusData.n8n_ready) {
        toast.success(`${workspace.name} esta listo!`);
        fetchWorkspaces();
      } else if (statusData.status === 'running' && !statusData.n8n_ready) {
        toast.info(`${workspace.name}: Inicializando base de datos...`, { duration: 6000 });
      } else if (statusData.status === 'initializing') {
        toast.info(`${workspace.name}: ${statusData.message || 'Inicializando...'}`, { duration: 5000 });
      } else {
        toast.info(`${workspace.name}: ${statusData.message || 'Verificando estado...'}`, { duration: 4000 });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
      toast.error(`Error al verificar ${workspace.name}: ${errorMessage}`);
    }
  };

  const fetchResourceUsage = async () => {
    if (!selectedWorkspace?.name) {
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
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cargar recursos');
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

  useEffect(() => {
    if (workspace.length === 0) return;
    const initializingInstances = workspace.filter(ws => ws.credencials?.status === 'initializing');
    if (initializingInstances.length === 0) return;

    const interval = setInterval(() => {
      initializingInstances.forEach(instance => checkInstanceStatus(instance));
    }, 30000);

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
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isModalOpen]);

  const createNewWorkSpace = async (productName: string, fields: ProductField) => {
    try {
      setIsLoading(true);
      const serviceName = fields.service_name || fields.Service_Name || '';

      if (!serviceName) {
        toast.error('Ingresa un nombre para el servicio');
        setIsLoading(false);
        return;
      }

      if (/[A-Z]/.test(serviceName)) {
        toast.error('El nombre no debe contener mayusculas');
        setIsLoading(false);
        return;
      }

      if (serviceName.trim() === 'n8n_free_treal') {
        toast.error('Nombre reservado por el sistema');
        setIsLoading(false);
        return;
      }

      if (serviceName.length < 3) {
        toast.error('Minimo 3 caracteres');
        setIsLoading(false);
        return;
      }

      if (planLimits && workspace.length >= planLimits.instances) {
        toast.error(`Limite de ${planLimits.instances} instancia(s) alcanzado`);
        setIsLoading(false);
        return;
      }

      toast.loading('Creando instancia...', { id: 'creating' });

      await axios.post('/api/suite/create-n8n', {
        service_name: serviceName,
        product_name: productName,
        plan: selectedPlanForInstance
      }, { headers: { 'Content-Type': 'application/json' } });

      toast.success('Instancia creada exitosamente', {
        id: 'creating',
        duration: 8000,
        description: 'El contenedor se esta configurando. Verificacion automatica cada 30s.'
      });

      fetchWorkspaces();
      handleCloseModal();
    } catch (error: any) {
      const errorData = error.response?.data;
      const isTimeoutError = errorData?.error_type === 'TIMEOUT';
      const suiteWasCreated = errorData?.suite_created === true;

      if (isTimeoutError && suiteWasCreated) {
        toast.success('Instancia creada. Configurando contenedor...', {
          id: 'creating',
          duration: 8000
        });
        fetchWorkspaces();
      } else {
        toast.error(errorData?.error || 'Error al crear instancia', { id: 'creating' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setSelectedProduct(product);
      const initialValues: ProductField = {};
      product.fields.forEach((field) => {
        Object.entries(field).forEach(([key, value]) => {
          initialValues[key] = value;
        });
      });
      setFormValues(initialValues);
    }
    setSelectedPlanForInstance('');
    setModalStep(1);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    setFormValues({});
    setSelectedPlanForInstance('');
    setModalStep(1);
  };

  const handleConfirm = () => {
    if (!selectedPlanForInstance) {
      toast.error('Selecciona un plan primero');
      return;
    }
    if (!selectedProduct) {
      toast.error('Selecciona un producto primero');
      return;
    }
    createNewWorkSpace(selectedProduct.name, formValues);
  };

  const handleInputChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleNextStep = () => {
    if (modalStep === 1 && !selectedPlanForInstance) {
      toast.error('Selecciona un plan');
      return;
    }
    if (modalStep === 2 && !selectedProduct) {
      toast.error('Selecciona un producto');
      return;
    }
    setModalStep(prev => prev + 1);
  };

  const init = async () => {
    if (!selectedWorkspace || isLoading) return;
    setIsLoading(true);
    try {
      await axios.post('/api/suite/init', {
        token: session?.access_token,
        name_service: selectedWorkspace?.name,
      }, { headers: { 'Content-Type': 'application/json' } });

      toast.success(`${selectedWorkspace?.name} iniciada`);
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
      toast.error(err.response?.data?.message || 'Error al iniciar');
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
      }, { headers: { 'Content-Type': 'application/json' } });

      toast.success(`${selectedWorkspace?.name} pausada`);
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
      toast.error(err.response?.data?.message || 'Error al pausar');
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
      }, { headers: { 'Content-Type': 'application/json' } });

      toast.success(`${selectedWorkspace?.name} eliminada`);
      setWorkspaceStruture(prev =>
        prev.filter(ws => ws.documentId !== selectedWorkspace.documentId)
      );
      setSelectedWorkspace(null);
      fetchWorkspaces();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al eliminar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Head>
        <title>Suite - BLXK Connect</title>
      </Head>

      {/* Left Sidebar */}
      <div className="w-72 lg:w-80 p-4 lg:p-6 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white mb-1">Connect Suite</h1>
          <p className="text-xs text-zinc-500">Gestiona tus instancias</p>
        </div>

        <div className="mb-6">
          <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
            <p className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider mb-1">Bienvenido</p>
            <p className="text-sm font-semibold text-white truncate">{username}</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tus Instancias</h2>
          <button
            onClick={() => handleOpenModal()}
            className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors"
            title="Nueva instancia"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          {workspace.length > 0 ? (
            workspace.map((ws) => (
              <button
                key={ws.documentId}
                onClick={() => setSelectedWorkspace(ws)}
                className={`w-full group flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                  selectedWorkspace?.documentId === ws.documentId
                    ? 'bg-zinc-800 border border-emerald-500/50'
                    : 'bg-zinc-800/30 border border-transparent hover:bg-zinc-800/50 hover:border-zinc-700'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  ws.activo
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : ws.credencials?.status === 'initializing'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-zinc-700 text-zinc-500'
                }`}>
                  <CubeIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    selectedWorkspace?.documentId === ws.documentId ? 'text-white' : 'text-zinc-300'
                  }`}>
                    {ws.name || 'Sin nombre'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      ws.activo
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : ws.credencials?.status === 'initializing'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-red-500/20 text-red-400'
                    }`}>
                      {ws.activo ? 'Activo' : ws.credencials?.status === 'initializing' ? 'Iniciando' : 'Inactivo'}
                    </span>
                    {ws.credencials?.status === 'initializing' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          checkInstanceStatus(ws);
                        }}
                        className="p-0.5 hover:bg-zinc-700 rounded transition-colors"
                        title="Verificar estado"
                      >
                        <ArrowPathIcon className="w-3 h-3 text-amber-400 animate-spin" />
                      </button>
                    )}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-8 px-4 border border-dashed border-zinc-700 rounded-xl">
              <SparklesIcon className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
              <p className="text-sm text-zinc-500">No tienes instancias</p>
              <button
                onClick={() => handleOpenModal()}
                className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
              >
                Crear primera instancia
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {selectedWorkspace ? (
          <div className="max-w-5xl mx-auto animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
                  {selectedWorkspace.name}
                  {selectedWorkspace.activo && (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full">
                      Activo
                    </span>
                  )}
                </h2>
                {selectedWorkspace.url && (
                  <a
                    href={selectedWorkspace.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-sm"
                  >
                    {selectedWorkspace.url}
                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedWorkspace.activo ? (
                  <button
                    onClick={pause}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    <StopIcon className="w-4 h-4" />
                    {isLoading ? 'Pausando...' : 'Pausar'}
                  </button>
                ) : (
                  <button
                    onClick={init}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    <PlayIcon className="w-4 h-4" />
                    {isLoading ? 'Iniciando...' : 'Iniciar'}
                  </button>
                )}
                <button
                  onClick={dele}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <TrashIcon className="w-4 h-4" />
                  {isLoading ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>

            {/* Resource Usage */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                    <CpuChipIcon className="w-5 h-5" />
                  </div>
                  <h3 className="font-medium text-zinc-300">CPU</h3>
                </div>
                <div className="text-2xl font-bold text-white mb-2">
                  {resourceUsage?.cpu || 0}%
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${resourceUsage?.cpu || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                    <ServerIcon className="w-5 h-5" />
                  </div>
                  <h3 className="font-medium text-zinc-300">Memoria</h3>
                </div>
                <div className="text-2xl font-bold text-white mb-2">
                  {resourceUsage ? `${resourceUsage.memory.usage.toFixed(0)}MB` : '0MB'}
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-1">
                  <div 
                    className="bg-purple-500 h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${resourceUsage?.memory.percent || 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-zinc-500">{resourceUsage?.memory.percent || 0}% usado</p>
              </div>

              <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                    <SignalIcon className="w-5 h-5" />
                  </div>
                  <h3 className="font-medium text-zinc-300">Red</h3>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase">Entrada</p>
                    <p className="text-lg font-bold text-white">{resourceUsage?.network.in || 0} KB</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-500 uppercase">Salida</p>
                    <p className="text-lg font-bold text-white">{resourceUsage?.network.out || 0} KB</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Credentials */}
            {selectedWorkspace.credencials && (
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                <div className="p-5 border-b border-zinc-800">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <ClipboardIcon className="w-4 h-4 text-zinc-500" />
                    Credenciales de Acceso
                  </h3>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(selectedWorkspace.credencials).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                        {key.replace(/_/g, ' ')}
                      </label>
                      <div className="relative">
                        <input
                          type={showFields[key] ? 'text' : 'password'}
                          value={value}
                          readOnly
                          className="w-full pl-3 pr-16 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 font-mono text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <button
                            onClick={() => toggleShow(key)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 rounded transition-colors"
                          >
                            {showFields[key] ? <EyeSlashIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(value);
                              toast.success('Copiado');
                            }}
                            className="p-1.5 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
                          >
                            <ClipboardIcon className="w-3.5 h-3.5" />
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
            <div className="w-20 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center mb-6">
              <RocketLaunchIcon className="w-10 h-10 text-zinc-600" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Selecciona una instancia
            </h2>
            <p className="text-zinc-500 max-w-md mx-auto mb-6 text-sm">
              Elige una instancia del menu lateral para ver sus detalles y metricas.
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="px-5 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl hover:bg-zinc-700 transition-all text-sm font-medium"
            >
              Crear Nueva Instancia
            </button>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-zinc-900 rounded-2xl w-full max-w-2xl overflow-hidden border border-zinc-800 shadow-2xl animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">Nueva Instancia</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Paso {modalStep} de 3</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-zinc-800">
              <div 
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${(modalStep / 3) * 100}%` }}
              ></div>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {/* Step 1: Plan Selection */}
              {modalStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <BoltIcon className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-sm font-semibold text-white">Selecciona un Plan</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {Object.entries(planData).map(([key, plan]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedPlanForInstance(key)}
                        className={`relative p-4 rounded-xl border text-left transition-all ${
                          selectedPlanForInstance === key
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                        }`}
                      >
                        {plan.popular && (
                          <span className="absolute -top-2 right-3 px-2 py-0.5 bg-emerald-500 text-zinc-950 text-[10px] font-bold rounded-full">
                            Popular
                          </span>
                        )}
                        {selectedPlanForInstance === key && (
                          <div className="absolute top-3 right-3">
                            <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
                          </div>
                        )}
                        <div className="mb-3">
                          {key === 'basic' && <StarIcon className="w-6 h-6 text-zinc-500" />}
                          {key === 'premium' && <SparklesIcon className="w-6 h-6 text-emerald-400" />}
                          {key === 'enterprise' && <RocketLaunchIcon className="w-6 h-6 text-purple-400" />}
                        </div>
                        <p className="font-bold text-white mb-1">{plan.name}</p>
                        <p className="text-lg font-bold text-emerald-400 mb-2">{plan.price}<span className="text-xs text-zinc-500">/mes</span></p>
                        <div className="space-y-1">
                          <p className="text-[10px] text-zinc-500">{plan.memory} RAM | {plan.cpu}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Product Selection */}
              {modalStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <CubeIcon className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-sm font-semibold text-white">Selecciona un Producto</h4>
                  </div>
                  {loadingProducts ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-700 border-t-emerald-500"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {products.map((product) => (
                        <button
                          key={product.name}
                          onClick={() => {
                            setSelectedProduct(product);
                            const initialValues: ProductField = {};
                            product.fields.forEach((field) => {
                              Object.entries(field).forEach(([key, value]) => {
                                initialValues[key] = value;
                              });
                            });
                            setFormValues(initialValues);
                          }}
                          className={`relative p-4 rounded-xl border text-left transition-all ${
                            selectedProduct?.name === product.name
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                          }`}
                        >
                          {selectedProduct?.name === product.name && (
                            <div className="absolute top-3 right-3">
                              <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
                            </div>
                          )}
                          <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center mb-3">
                            <CubeIcon className="w-5 h-5 text-zinc-400" />
                          </div>
                          <p className="font-bold text-white">{product.name}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Configuration */}
              {modalStep === 3 && selectedProduct && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <ClipboardIcon className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-sm font-semibold text-white">Configuracion</h4>
                  </div>

                  {/* Summary */}
                  <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Plan seleccionado</span>
                      <span className="text-white font-medium capitalize">{selectedPlanForInstance}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-zinc-400">Producto</span>
                      <span className="text-white font-medium">{selectedProduct.name}</span>
                    </div>
                  </div>

                  {selectedProduct.fields.map((field, index) => (
                    <div key={index}>
                      {Object.keys(field).map((key) => {
                        if (key === 'service_name' || key === 'Service_Name') return (
                          <div key={key}>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                              Nombre del Servicio <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={formValues[key] || ''}
                              onChange={(e) => handleInputChange(key, e.target.value)}
                              className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-white placeholder:text-zinc-500"
                              placeholder="ej: mi-instancia-n8n"
                            />
                            <p className="text-xs text-zinc-500 mt-2">
                              Solo minusculas, numeros y guiones. Minimo 3 caracteres.
                            </p>
                          </div>
                        );
                        return null;
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-zinc-800 flex justify-between gap-3">
              {modalStep > 1 ? (
                <button
                  onClick={() => setModalStep(prev => prev - 1)}
                  className="px-5 py-2.5 rounded-xl font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  Atras
                </button>
              ) : (
                <button
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-xl font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
              )}
              
              {modalStep < 3 ? (
                <button
                  onClick={handleNextStep}
                  className="px-6 py-2.5 rounded-xl font-semibold text-zinc-950 bg-emerald-500 hover:bg-emerald-400 transition-all flex items-center gap-2"
                >
                  Continuar
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="px-6 py-2.5 rounded-xl font-semibold text-zinc-950 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? 'Creando...' : 'Crear Instancia'}
                </button>
              )}
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

export async function getServerSideProps() {
  return { props: {} };
}
