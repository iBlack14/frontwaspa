'use client';
import { SessionProvider, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebard from '../components/dashboard/index';
import { Toaster, toast } from 'sonner';
import { ArrowTopRightOnSquareIcon, PlusIcon, ClipboardIcon, ArrowPathIcon, StopIcon, EyeIcon, EyeSlashIcon, PlayIcon, TrashIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import Image from 'next/image';

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
      const res = await fetch(`/api/suite?token=${typedSession.jwt}`, {
        headers: {
          Authorization: `Bearer ''`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Error API: ${res.status}`);
      }

      const data = await res.json();
      console.log('Workspaces cargados:', data);

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
      console.error('Error al cargar workspaces:', err);
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
      const res = await fetch('/api/products');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Error API: ${res.status}`);
      }
      const data = await res.json();
      console.log('Productos cargados:', data);
      setProducts(data);
      setError(null); // Limpiar error si la carga fue exitosa
      setLoadingProducts(false);
    } catch (err: any) {
      console.error('Error al cargar productos:', err);
      setError(err.message || 'Error al cargar los productos.');
      toast.error('No se pudieron cargar los productos');
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
    <div className="flex  ">
      <Toaster richColors position="top-right" />

      {/* Left Sidebar (Fixed Width) */}
      <div className="w-64 p-5 text-gray-900 dark:text-white">
        <h1 className="text-2xl font-bold mb-6">Bienvenido, {username}</h1>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Tu Suite 😎😎</h2>
          <button
            onClick={() => setSelectedWorkspace(null)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition"
          >
            <PlusIcon className="w-5 h-5" />
            {workspace.length === 0 && 'Prueba de n8n gratis por 7 días'}
          </button>
        </div>

        <div className="mb-5">
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {workspace.length > 0 ? (
            <div className="flex flex-col divide-y divide-gray-200 dark:divide-zinc-700">
              {workspace.map((workspaces) => (
                <button
                  key={workspaces.documentId}
                  className={`flex my-0.5 justify-between rounded-md items-center py-1 px-2 text-left transition ${selectedWorkspace?.documentId === workspaces.documentId
                    ? 'bg-emerald-100 dark:bg-zinc-500/40 text-gray-900 dark:text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-zinc-500/40'
                    }`}
                  onClick={() => setSelectedWorkspace(workspaces)}
                >
                  <span className="mr-2">
                    <span
                      className={`inline-block w-3 h-3 rounded-full ${workspaces.activo ? 'bg-emerald-500/70' : 'bg-red-500/70'
                        }`}
                      title={workspaces.activo ? 'Activo' : 'Inactivo'}
                    />
                  </span>
                  <span className="text-gray-900 dark:text-white">{workspaces.name || 'Sin nombre'}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-zinc-400">No tienes sesiones aún. Crea una nueva instancia.</p>
          )}
        </div>
      </div>

      {/* Right Content Area (Dynamic) */}
      <div className="w-full bg-white dark:bg-zinc-900 p-5 text-gray-900 dark:text-white rounded-bl-3xl rounded-tl-3xl border-l border-gray-200 dark:border-zinc-800">

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
          <div>
            {loadingProducts ? (
              <p className="text-gray-600 dark:text-zinc-400">Cargando productos...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product, index) => (
                  <div
                    key={index}
                    className="bg-gray-100 dark:bg-zinc-800 rounded-lg p-4 shadow-md dark:shadow-none flex flex-col h-full cursor-pointer hover:bg-gray-200 dark:hover:bg-zinc-700 transition"
                    onClick={() => handleOpenModal(product)}
                  >
                    <div className="flex-1 flex items-center justify-center mb-2">
                      <Image
                        src={product.img}
                        alt={product.name}
                        width={300}
                        height={200}
                        className="object-contain w-full h-40 rounded-md"
                        style={{ maxHeight: '80px', width: '100%' }}
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-center">{product.name}</h3>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-zinc-400">No hay productos disponibles.</p>
            )}
          </div>
        )}

        
      </div>

      {/* Modal */}
      {isModalOpen && selectedProduct && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Crear Nueva Instancia</h2>
              {planLimits && (
                <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-full">
                  {workspace.length}/{planLimits.instances} usadas
                </span>
              )}
            </div>
            <p className="text-gray-700 dark:text-zinc-300 mb-4">
              Configura los detalles para la nueva instancia de{' '}
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedProduct.name}</span>
            </p>
            
            {/* Selector de Plan */}
            <div className="mb-6 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg">
              <label className="block text-gray-900 dark:text-white mb-3 font-semibold text-lg">
                1️⃣ Selecciona tu Plan
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { value: 'free', name: 'Free', desc: '256MB RAM, 256 CPU, 1 instancia', color: 'gray' },
                  { value: 'basic', name: 'Basic', desc: '512MB RAM, 512 CPU, 1 instancia', color: 'blue' },
                  { value: 'premium', name: 'Premium', desc: '1GB RAM, 1024 CPU, 3 instancias', color: 'purple' },
                  { value: 'pro', name: 'Pro', desc: '2GB RAM, 2048 CPU, 10 instancias', color: 'emerald' },
                ].map((plan) => (
                  <button
                    key={plan.value}
                    type="button"
                    onClick={() => setSelectedPlanForInstance(plan.value)}
                    disabled={isLoading}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedPlanForInstance === plan.value
                        ? `border-${plan.color}-500 bg-${plan.color}-50 dark:bg-${plan.color}-900/30 ring-2 ring-${plan.color}-500`
                        : 'border-gray-300 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white text-lg">
                          {plan.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
                          {plan.desc}
                        </div>
                      </div>
                      {selectedPlanForInstance === plan.value && (
                        <div className="text-emerald-500 text-2xl">✓</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              {!selectedPlanForInstance && (
                <p className="text-amber-600 dark:text-amber-400 text-sm mt-2 flex items-center gap-1">
                  ⚠️ Debes seleccionar un plan para continuar
                </p>
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
                          
                          {/* Preview de URL */}
                          {formValues[key] && formValues[key].length >= 3 && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                              <p className="text-xs text-blue-700 dark:text-blue-400 font-semibold mb-1">
                                🌐 Tu instancia estará disponible en:
                              </p>
                              <p className="text-sm text-blue-900 dark:text-blue-300 font-mono break-all">
                                http://localhost:PUERTO (desarrollo local)
                              </p>
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                💡 El puerto se asignará automáticamente al crear la instancia
                              </p>
                            </div>
                          )}
                          
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
                className="bg-gray-200 dark:bg-zinc-600 text-gray-700 dark:text-white px-5 py-2.5 rounded-lg hover:bg-gray-300 dark:hover:bg-zinc-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading || !selectedPlanForInstance || (planLimits && workspace.length >= planLimits.instances)}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-2.5 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-emerald-500/30"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    ✨ Crear Instancia
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