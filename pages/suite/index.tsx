'use client';
import { SessionProvider, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebard from '../components/dashboard/index';
import { Toaster, toast } from 'sonner';
import { ArrowTopRightOnSquareIcon, PlusIcon, ClipboardIcon, ArrowPathIcon, StopIcon, EyeIcon, EyeSlashIcon, PlayIcon, TrashIcon, SparklesIcon, RocketLaunchIcon, BoltIcon, StarIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import Image from 'next/image';
import { api } from '../../lib/api-client';

interface CustomSession {
  id?: string;
  firstName?: string;
  username?: string;
  jwt?: string;
}

interface WorkspaceStruture {
  id: number;
  documentId: string;
  name?: string | null;
  url?: string | null;
  activo?: boolean;
  credencials?: { [key: string]: string } | null;
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
  const { data: session, status } = useSession();
  const username = (session as CustomSession | null)?.username;
  const typedSession = session as CustomSession | null;
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
  const [isLoading, setIsLoading] = useState(false); // Para manejar estados de carga
  const [userPlan, setUserPlan] = useState<string>('free'); // Plan del usuario
  const [planLimits, setPlanLimits] = useState<any>(null); // Límites del plan
  const [selectedPlanForInstance, setSelectedPlanForInstance] = useState<string>(''); // Plan seleccionado para la instancia

  // State to control visibility of sensitive fields for credentials
  const [showFields, setShowFields] = useState<{ [key: string]: boolean }>({});

  // Helper to toggle visibility
  const toggleShow = (key: string) => {
    setShowFields(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Trae los workspaces cada 5 segundos
  const fetchWorkspaces = async () => {
    if (!typedSession?.id) return;
    try {
      const data = await api.get(`/api/suite?token=${typedSession.jwt}`, {
        headers: {
          Authorization: `Bearer ''`,
        },
        showErrorToast: false, // Manejamos el error manualmente
      });

      // Verificar que data tenga la estructura esperada
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

      // Actualizar el workspace seleccionado si existe
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
      
      // Definir límites según plan
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
      const data = await api.get('/api/products');
      setProducts(data);
      setError(null);
    } catch (err: any) {
      console.error('[fetchProducts] Error:', err);
      setError(err.message || 'Error al cargar los productos.');
    } finally {
      setLoadingProducts(false);
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
            usage: data.memory.usage / 1024 / 1024, // Convert bytes to MB
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
      fetchUserPlan(); // Cargar plan del usuario
    }
  }, [status]);

  useEffect(() => {
    if (selectedWorkspace) {
      fetchResourceUsage();
    } else {
      setResourceUsage(null);
    }
  }, [selectedWorkspace]);

  // Accesibilidad del modal
  useEffect(() => {
    if (isModalOpen) {
      // Guardar el elemento que tenía el foco antes de abrir el modal
      const previousActiveElement = document.activeElement as HTMLElement;
      
      // Focus en el primer input del modal
      setTimeout(() => {
        const firstInput = document.querySelector<HTMLInputElement>('input[type="text"]');
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);

      // Cerrar modal con tecla Esc
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleCloseModal();
        }
      };

      // Trap focus dentro del modal
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

      // Prevenir scroll del body
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('keydown', handleTabKey);
        document.body.style.overflow = 'unset';
        
        // Restaurar foco al elemento anterior
        if (previousActiveElement) {
          previousActiveElement.focus();
        }
      };
    }
  }, [isModalOpen]);

  const createNewWorkSpace = async (productName: string, fields: ProductField) => {
    try {
      setIsLoading(true);
      
      // Extraer service_name de los campos
      const serviceName = fields.service_name || fields.Service_Name || '';

      // Validaciones
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

      // Verificar límites del plan
      if (planLimits && workspace.length >= planLimits.instances) {
        toast.error(`Has alcanzado el límite de ${planLimits.instances} instancia(s) para tu plan ${userPlan}`);
        setIsLoading(false);
        return;
      }

      toast.loading('Creando instancia de n8n...', { id: 'creating' });

      await axios.post(
        '/api/suite/create-n8n',
        { 
          service_name: serviceName,
          product_name: productName,
          plan: selectedPlanForInstance // Enviar el plan seleccionado
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      toast.success('✅ Instancia de n8n creada con éxito', { id: 'creating' });
      fetchWorkspaces();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error al crear nueva instancia:', error.response?.data || error.message);
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Error al crear nueva instancia', { id: 'creating' });
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
    setSelectedPlanForInstance(''); // Resetear plan seleccionado
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
        token: typedSession?.jwt,
        name_service: selectedWorkspace?.name,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });

      toast.success(`${selectedWorkspace?.name} iniciada con éxito`);

      // Actualizar inmediatamente el estado del workspace seleccionado
      setSelectedWorkspace(prev => prev ? { ...prev, activo: true } : null);

      // Actualizar también la lista de workspaces
      setWorkspaceStruture(prev =>
        prev.map(ws =>
          ws.documentId === selectedWorkspace.documentId
            ? { ...ws, activo: true }
            : ws
        )
      );

      // Hacer fetch completo para sincronizar con el servidor
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
        token: typedSession?.jwt,
        name_service: selectedWorkspace?.name,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });

      toast.success(`${selectedWorkspace?.name} pausada con éxito`);

      // Actualizar inmediatamente el estado del workspace seleccionado
      setSelectedWorkspace(prev => prev ? { ...prev, activo: false } : null);

      // Actualizar también la lista de workspaces
      setWorkspaceStruture(prev =>
        prev.map(ws =>
          ws.documentId === selectedWorkspace.documentId
            ? { ...ws, activo: false }
            : ws
        )
      );

      // Hacer fetch completo para sincronizar con el servidor
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
        token: typedSession?.jwt,
        name_service: selectedWorkspace?.name,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });

      toast.success(`${selectedWorkspace?.name} eliminada con éxito`);

      // Remover el workspace de la lista y limpiar selección
      setWorkspaceStruture(prev =>
        prev.filter(ws => ws.documentId !== selectedWorkspace.documentId)
      );
      setSelectedWorkspace(null);

      // Hacer fetch completo para sincronizar con el servidor
      fetchWorkspaces();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al eliminar una suite');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Toaster richColors position="top-right" expand={true} closeButton />

      {/* Left Sidebar (Fixed Width) */}
      <div className="w-80 p-6 text-gray-900 dark:text-white bg-gradient-to-b from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-800 border-r border-gray-200 dark:border-zinc-700">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">Bienvenido</h1>
          <p className="text-lg text-gray-600 dark:text-zinc-400">{username} 👋</p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-emerald-500" />
            Tu Suite
          </h2>
          <button
            onClick={() => setSelectedWorkspace(null)}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2.5 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transform hover:scale-105 active:scale-95"
          >
            <PlusIcon className="w-5 h-5" />
            {workspace.length === 0 ? 'Crear' : ''}
          </button>
        </div>

        <div className="mb-5">
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}
          {workspace.length > 0 ? (
            <div className="flex flex-col gap-2">
              {workspace.map((workspaces) => (
                <button
                  key={workspaces.documentId}
                  className={`group flex justify-between items-center py-3 px-4 text-left transition-all duration-300 rounded-xl ${selectedWorkspace?.documentId === workspaces.documentId
                    ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 dark:from-emerald-500/30 dark:to-cyan-500/30 border-2 border-emerald-500 dark:border-emerald-400 shadow-lg shadow-emerald-500/20'
                    : 'bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md'
                    }`}
                  onClick={() => setSelectedWorkspace(workspaces)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="relative">
                      <span
                        className={`inline-block w-3 h-3 rounded-full ${workspaces.activo ? 'bg-emerald-500' : 'bg-red-500'
                        } animate-pulse`}
                        title={workspaces.activo ? 'Activo' : 'Inactivo'}
                      />
                      {workspaces.activo && (
                        <span className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-75"></span>
                      )}
                    </div>
                    <span className="text-gray-900 dark:text-white font-medium group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                      {workspaces.name || 'Sin nombre'}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${workspaces.activo 
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {workspaces.activo ? 'Online' : 'Offline'}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-800 dark:to-zinc-900 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl text-center">
              <SparklesIcon className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-zinc-500" />
              <p className="text-gray-600 dark:text-zinc-400 text-sm">No tienes suites aún.</p>
              <p className="text-gray-500 dark:text-zinc-500 text-xs mt-1">Crea tu primera instancia</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Content Area (Dynamic) */}
      <div className="flex-1 bg-gradient-to-br from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-800 p-8 text-gray-900 dark:text-white overflow-y-auto">

        {selectedWorkspace ? (
          selectedWorkspace.name === 'n8n_free_treal' ? (

            <div>
              <div className="mb-6 flex flex-row items-center gap-8">
                <div className="text-2xl flex items-center gap-2">
                  <span className="font-semibold">Nombre:</span>
                  <span>{selectedWorkspace.name || 'Sin nombre'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedWorkspace.url ? (
                    <span className="flex items-center gap-1">
                      <a
                        href={selectedWorkspace.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300"
                        title="Abrir en nueva pestaña"
                      >
                        <ArrowTopRightOnSquareIcon className="w-9 h-9" />
                      </a>
                    </span>
                  ) : (
                    <span className="text-zinc-400"></span>
                  )}
                </div>
              </div>
              <div className="text-gray-700 dark:text-zinc-300">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg block mb-2">
                  ¡Bienvenidos! Este espacio es para ustedes, disfruten su prueba gratuita de <b>n8n</b> 🚀
                </span>
                Recuerden que esta instancia es para pruebas y la infraestructura es administrada por el equipo de soporte.<br />
                <span className="text-amber-400 font-semibold">
                  Si contratan un plan, podrán migrar sus flujos y disfrutar de más beneficios.
                </span>
              </div>
              <button
                onClick={() => setSelectedWorkspace(null)}
                className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition"
              >
                Volver
              </button>
            </div>

          ) : (
            <div>

              <div className="mb-6 flex flex-row items-center gap-8">
                <div className="text-2xl flex items-center gap-2">
                  <span className="font-semibold">Nombre:</span>
                  <span>{selectedWorkspace.name || 'Sin nombre'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedWorkspace.url ? (
                    <span className="flex items-center gap-1">
                      <a
                        href={selectedWorkspace.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300"
                        title="Abrir en nueva pestaña"
                      >
                        <ArrowTopRightOnSquareIcon className="w-9 h-9" />
                      </a>
                    </span>
                  ) : (
                    <span className="text-zinc-400"></span>
                  )}
                </div>
                <div className="flex flex-row gap-3">
                  {selectedWorkspace.activo ? (
                    <button
                      className={`flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition text-sm ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Parar"
                      onClick={pause}
                      disabled={isLoading}
                    >
                      <StopIcon className="w-7 h-7" />
                      {isLoading ? 'Pausando...' : ''}
                    </button>
                  ) : (
                    <button
                      className={`flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded transition text-sm ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Iniciar"
                      onClick={init}
                      disabled={isLoading}
                    >
                      <PlayIcon className="w-7 h-7" />
                      {isLoading ? 'Iniciando...' : ''}
                    </button>
                  )}
                  <button
                    className={`flex items-center gap-1 bg-zinc-700 hover:bg-zinc-800 text-white px-3 py-1 rounded transition text-sm ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Eliminar"
                    onClick={dele}
                    disabled={isLoading}
                  >
                    <TrashIcon className="w-7 h-7" />
                    {isLoading ? 'Eliminando...' : ''}
                  </button>
                </div>
              </div>

              <div className="bg-gray-100 dark:bg-zinc-800 rounded-lg p-6 shadow-md dark:shadow-none mb-4">
                <h3 className="text-lg font-semibold mb-2">Uso de Recursos</h3>
                <div className="mb-3">

                </div>
                <div className="mb-3">
                  <span className="block text-gray-600 dark:text-zinc-400 mb-1">Memoria</span>
                  <div className="w-full bg-gray-300 dark:bg-zinc-700 rounded-full h-4">
                    <div
                      className="bg-emerald-400 h-4 rounded-full"
                      style={{ width: `${resourceUsage?.memory.percent || 0}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-zinc-300">
                    {resourceUsage
                      ? `${resourceUsage.memory.usage.toFixed(2)} MB / ${(resourceUsage.memory.usage / (resourceUsage.memory.percent / 100)).toFixed(2)} MB`
                      : 'Cargando...'}
                  </span>



                  {selectedWorkspace.credencials && (
                    <div className="bg-gray-100 dark:bg-zinc-800 rounded-lg py-6 mb-4">
                      <h3 className="text-lg font-semibold mb-2">Credenciales</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(selectedWorkspace.credencials)
                          .filter(([key]) => key !== 'username' && key !== 'password' && key !== 'setup_required' && key !== 'note')
                          .map(([key, value], idx, arr) => {
                            // Si es el último y hay un número impar, que ocupe todo el ancho
                            const isLast = idx === arr.length - 1 && arr.length % 2 !== 0;
                            const isSensitive = key === 'urlInterna';
                            const show = !!showFields[key];
                            return (
                              <div
                                key={key}
                                className={`flex flex-col bg-gray-200 dark:bg-zinc-900 rounded-md p-4 ${isLast ? 'md:col-span-2' : ''}`}
                              >
                                <span className="text-gray-700 dark:text-zinc-400 font-semibold mb-1">{key}:</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-900 dark:text-zinc-200 break-all text-base bg-gray-300 dark:bg-zinc-800 rounded px-3 py-1 select-all w-full block">
                                    {isSensitive && !show ? '••••••••' : String(value)}
                                  </span>
                                {isSensitive && (
                                  <button
                                    className="bg-gray-400 dark:bg-zinc-700 hover:bg-gray-500 dark:hover:bg-zinc-600 text-white px-2 py-1 rounded transition text-xs flex items-center gap-1"
                                    title={show ? 'Ocultar' : 'Mostrar'}
                                    type="button"
                                    onClick={() => toggleShow(key)}
                                  >
                                    {show ? (
                                      <EyeIcon className="w-6 h-6" />
                                    ) : (
                                      <EyeSlashIcon className="w-6 h-6" />

                                    )}
                                  </button>
                                )}
                                <button
                                  className="bg-zinc-700 hover:bg-zinc-600 text-white px-2 py-1 rounded transition text-xs flex items-center gap-1"
                                  title="Copiar"
                                  onClick={() => {
                                    navigator.clipboard.writeText(String(value));
                                    toast.success('Copiado al portapapeles');
                                  }}
                                  type="button"
                                >
                                  <ClipboardIcon className="w-6 h-6" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}


                </div>
              </div>












              <button
                onClick={() => setSelectedWorkspace(null)}
                className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition"
              >
                Volver
              </button>
            </div>

          )

        ) : (
          <div className="animate-fadeIn">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Crear Nueva Suite</h2>
              <p className="text-gray-600 dark:text-zinc-400">Selecciona un producto para comenzar</p>
            </div>
            {loadingProducts ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-zinc-700 animate-pulse"
                  >
                    {/* Skeleton Image */}
                    <div className="flex-1 flex items-center justify-center mb-4 bg-gray-200 dark:bg-zinc-700 rounded-xl h-32"></div>
                    {/* Skeleton Title */}
                    <div className="h-6 bg-gray-200 dark:bg-zinc-700 rounded-lg mb-4 w-3/4 mx-auto"></div>
                    {/* Skeleton Button */}
                    <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded-lg w-1/2 mx-auto"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product, index) => (
                  <div
                    key={index}
                    className="group bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl dark:shadow-none border border-gray-200 dark:border-zinc-700 flex flex-col h-full cursor-pointer transition-all duration-300 hover:scale-105 hover:border-emerald-400 dark:hover:border-emerald-500"
                    onClick={() => handleOpenModal(product)}
                  >
                    <div className="flex-1 flex items-center justify-center mb-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800 rounded-xl p-6">
                      <Image
                        src={product.img}
                        alt={product.name}
                        width={300}
                        height={200}
                        className="object-contain w-full h-32 transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                    <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{product.name}</h3>
                    <div className="mt-4 text-center">
                      <span className="inline-flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                        Crear instancia
                        <ArrowTopRightOnSquareIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <SparklesIcon className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-zinc-500" />
                <p className="text-gray-600 dark:text-zinc-400 text-lg">No hay productos disponibles.</p>
              </div>
            )}
          </div>
        )}

        
      </div>

      {/* Modal */}
      {isModalOpen && selectedProduct && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={handleCloseModal}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="bg-white dark:bg-zinc-800 p-8 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-zinc-700 animate-slideInRight max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 id="modal-title" className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Crear Nueva Instancia</h2>
                <p className="text-sm text-gray-600 dark:text-zinc-400">
                  Configura tu instancia de{' '}
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedProduct.name}</span>
                </p>
              </div>
              {planLimits && (
                <div className="text-right">
                  <span className="text-xs bg-gradient-to-r from-emerald-100 to-cyan-100 dark:from-emerald-900/30 dark:to-cyan-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full font-semibold">
                    {workspace.length}/{planLimits.instances} usadas
                  </span>
                </div>
              )}
            </div>
            
            {/* Selector de Plan */}
            <div className="mb-6 p-6 bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 dark:from-cyan-900/20 dark:via-blue-900/20 dark:to-purple-900/20 border-2 border-cyan-200 dark:border-cyan-800 rounded-2xl shadow-inner">
              <label id="plan-selector-label" className="block text-gray-900 dark:text-white mb-3 font-semibold text-lg">
                1️⃣ Selecciona tu Plan
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div role="radiogroup" aria-labelledby="plan-selector-label" className="grid grid-cols-1 gap-3">
                {[
                  { 
                    value: 'free', 
                    name: 'Free', 
                    desc: '256MB RAM, 256 CPU, 1 instancia',
                    subtitle: 'Ideal para pruebas',
                    icon: SparklesIcon,
                    styles: {
                      border: 'border-gray-400',
                      bg: 'bg-gray-50 dark:bg-gray-900/30',
                      ring: 'ring-gray-500',
                      hover: 'hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/50',
                      iconColor: 'text-gray-600 dark:text-gray-400'
                    }
                  },
                  { 
                    value: 'basic', 
                    name: 'Basic', 
                    desc: '512MB RAM, 512 CPU, 1 instancia',
                    subtitle: 'Para proyectos pequeños',
                    icon: BoltIcon,
                    styles: {
                      border: 'border-blue-400',
                      bg: 'bg-blue-50 dark:bg-blue-900/30',
                      ring: 'ring-blue-500',
                      hover: 'hover:border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-800/50',
                      iconColor: 'text-blue-600 dark:text-blue-400'
                    }
                  },
                  { 
                    value: 'premium', 
                    name: 'Premium', 
                    desc: '1GB RAM, 1024 CPU, 3 instancias',
                    subtitle: 'Para equipos medianos',
                    icon: StarIcon,
                    badge: 'Recomendado',
                    styles: {
                      border: 'border-purple-400',
                      bg: 'bg-purple-50 dark:bg-purple-900/30',
                      ring: 'ring-purple-500',
                      hover: 'hover:border-purple-500 hover:bg-purple-100 dark:hover:bg-purple-800/50',
                      iconColor: 'text-purple-600 dark:text-purple-400'
                    }
                  },
                  { 
                    value: 'pro', 
                    name: 'Pro', 
                    desc: '2GB RAM, 2048 CPU, 10 instancias',
                    subtitle: 'Máximo rendimiento',
                    icon: RocketLaunchIcon,
                    badge: 'Popular',
                    styles: {
                      border: 'border-emerald-400',
                      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
                      ring: 'ring-emerald-500',
                      hover: 'hover:border-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-800/50',
                      iconColor: 'text-emerald-600 dark:text-emerald-400'
                    }
                  },
                ].map((plan) => {
                  const PlanIcon = plan.icon;
                  const isSelected = selectedPlanForInstance === plan.value;
                  
                  return (
                    <button
                      key={plan.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setSelectedPlanForInstance(plan.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedPlanForInstance(plan.value);
                        }
                      }}
                      disabled={isLoading}
                      className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-left group ${
                        isSelected
                          ? `${plan.styles.border} ${plan.styles.bg} ring-2 ${plan.styles.ring} shadow-lg transform scale-[1.02]`
                          : `border-gray-300 dark:border-zinc-700 ${plan.styles.hover}`
                      } disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 ${plan.styles.ring}`}
                    >
                      {plan.badge && (
                        <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-md">
                          {plan.badge}
                        </span>
                      )}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${plan.styles.bg} ${plan.styles.iconColor} transition-transform group-hover:scale-110`}>
                            <PlanIcon className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                              {plan.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5 font-medium">
                              {plan.subtitle}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-zinc-400 mt-2">
                              {plan.desc}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircleIcon className="w-7 h-7 text-emerald-500 flex-shrink-0 animate-in zoom-in duration-200" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              {!selectedPlanForInstance && (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-amber-700 dark:text-amber-400 text-sm flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    <span className="font-medium">Debes seleccionar un plan para continuar</span>
                  </p>
                </div>
              )}
            </div>
            {planLimits && workspace.length >= planLimits.instances && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-400 text-sm">
                  ⚠️ Has alcanzado el límite de tu plan <b>{userPlan}</b>. Actualiza tu plan para crear más instancias.
                </p>
              </div>
            )}
            {/* Campos de Configuración */}
            <div className="mb-3">
              <label className="block text-gray-900 dark:text-white mb-3 font-semibold text-lg">
                2️⃣ Configura tu Instancia
              </label>
            </div>
            <div className="space-y-4">
              {selectedProduct.fields.map((field, index) => (
                <div key={index}>
                  {Object.entries(field).map(([key, value]) => {
                    // Solo mostrar el campo service_name, ocultar service_url
                    if (key !== 'service_name') return null;
                    
                    return (
                      <div key={key} className="mb-4">
                        <label className="block text-gray-700 dark:text-zinc-300 mb-2 font-medium">
                          Nombre del Servicio
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          value={formValues[key] || ''}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                          className={`w-full bg-white dark:bg-zinc-700 text-gray-900 dark:text-white border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 transition-all ${
                            /[A-Z]/.test(formValues[key] || '')
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 dark:border-zinc-600 focus:ring-emerald-500'
                          }`}
                          placeholder="ej: mi_instancia_n8n"
                          disabled={isLoading}
                        />
                      {key === 'service_name' && (
                        <div className="mt-2 space-y-2">
                          <p className="text-xs text-gray-500 dark:text-zinc-400">
                            💡 Usa solo minúsculas, números y guiones bajos (_)
                          </p>
                          
                          
                          {/[A-Z]/.test(formValues[key] || '') && (
                            <p className="text-red-500 text-sm flex items-center gap-1">
                              ❌ No debe contener mayúsculas
                            </p>
                          )}
                          {(formValues[key] || '').trim() === 'n8n_free_treal' && (
                            <p className="text-red-500 text-sm flex items-center gap-1">
                              ❌ El nombre <b>n8n_free_treal</b> está reservado
                            </p>
                          )}
                          {formValues[key] && formValues[key].length < 3 && (
                            <p className="text-orange-500 text-sm flex items-center gap-1">
                              ⚠️ Mínimo 3 caracteres
                            </p>
                          )}
                          {formValues[key] && formValues[key].length >= 3 && !/[A-Z]/.test(formValues[key]) && formValues[key] !== 'n8n_free_treal' && (
                            <p className="text-emerald-500 text-sm flex items-center gap-1">
                              ✅ Nombre válido
                            </p>
                          )}
                        </div>
                      )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-zinc-700">
              <button
                onClick={handleCloseModal}
                disabled={isLoading}
                className="bg-gray-200 dark:bg-zinc-600 text-gray-700 dark:text-white px-6 py-3 rounded-xl hover:bg-gray-300 dark:hover:bg-zinc-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading || !selectedPlanForInstance || (planLimits && workspace.length >= planLimits.instances)}
                title={!selectedPlanForInstance ? 'Debes seleccionar un plan primero' : (planLimits && workspace.length >= planLimits.instances) ? 'Has alcanzado el límite de tu plan' : 'Crear nueva instancia'}
                className="relative bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-3 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transform hover:scale-105 active:scale-95 disabled:transform-none font-bold group"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    Crear Instancia
                  </>
                )}
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