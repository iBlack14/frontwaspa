'use client';
import { SessionProvider, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

      const data = await res.json();

      if (!res.ok) {
        throw new Error(`Error API: ${res.status}`);
      }

      const fetchedWorkspaces: WorkspaceStruture[] = data[0].suites.map((item: any) => ({
        id: item.id,
        documentId: item.documentId,
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
        throw new Error(`Error API: ${res.status}`);
      }
      const data = await res.json();
      setProducts(data);
      setLoadingProducts(false);
    } catch (err: any) {
      console.error('Error al cargar productos:', err);
      setError(err.message || 'Error al cargar los productos.');
      setLoadingProducts(false);
    }
  };

  const fetchResourceUsage = async () => {
    // Temporalmente deshabilitado - implementar después
    return;
    
    if (!selectedWorkspace?.name || !typedSession?.jwt) {
      console.warn('Missing required parameters:', { workspaceName: selectedWorkspace?.name, jwt: typedSession?.jwt });
      return;
    }
    try {
      const res = await axios.post('/api/suite/usage', {
        token: typedSession!.jwt,
        name_service: selectedWorkspace!.name,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });
      const data = res.data[0]?.result?.data?.json;
      if (data) {
        setResourceUsage({
          cpu: data.cpu.percent * 100, // Convert to percentage
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
      // Extraer service_name y service_url de los campos
      const serviceName = fields.service_name || fields.Service_Name || '';
      const serviceUrl = fields.service_url || fields.Service_Url || '';

      if (!serviceName) {
        toast.error('Por favor ingresa un nombre para el servicio');
        return;
      }

      await axios.post(
        '/api/suite/create-n8n',
        { 
          service_name: serviceName,
          service_url: serviceUrl,
          product_name: productName
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      toast.success('Nueva instancia creada con éxito');
      fetchWorkspaces();
    } catch (error: any) {
      console.error('Error al crear nueva instancia:', error.response?.data || error.message);
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Error al crear nueva instancia');
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
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    setFormValues({});
  };

  const handleConfirm = () => {
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
      <div className="w-64 p-5 text-white">
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
            <div className="flex flex-col divide-y divide-zinc-700">
              {workspace.map((workspaces) => (
                <button
                  key={workspaces.documentId}
                  className={`flex my-0.5 justify-between rounded-md items-center py-1 px-2 text-left transition ${selectedWorkspace?.documentId === workspaces.documentId
                    ? 'bg-zinc-500/40 text-white'
                    : 'hover:bg-zinc-500/40'
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
                  <span className="text-white">{workspaces.name || 'Sin nombre'}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-zinc-400">No tienes sesiones aún. Crea una nueva instancia.</p>
          )}
        </div>
      </div>

      {/* Right Content Area (Dynamic) */}
      <div className="w-full bg-zinc-900 p-5 text-white rounded-bl-3xl rounded-tl-3xl">

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
              <div className="text-zinc-300">
                <span className="text-emerald-400 font-bold text-lg block mb-2">
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

              <div className="bg-zinc-800 rounded-lg p-6 shadow-md mb-4">
                <h3 className="text-lg font-semibold mb-2">Uso de Recursos</h3>
                <div className="mb-3">

                </div>
                <div className="mb-3">
                  <span className="block text-zinc-400 mb-1">Memoria</span>
                  <div className="w-full bg-zinc-700 rounded-full h-4">
                    <div
                      className="bg-emerald-400 h-4 rounded-full"
                      style={{ width: `${resourceUsage?.memory.percent || 0}%` }}
                    />
                  </div>
                  <span className="text-sm text-zinc-300">
                    {resourceUsage
                      ? `${resourceUsage.memory.usage.toFixed(2)} MB / ${(resourceUsage.memory.usage / (resourceUsage.memory.percent / 100)).toFixed(2)} MB`
                      : 'Cargando...'}
                  </span>



                  {selectedWorkspace.credencials && (
                    <div className="bg-zinc-800 rounded-lg py-6 mb-4">
                      <h3 className="text-lg font-semibold mb-2">Credenciales</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(selectedWorkspace.credencials).map(([key, value], idx, arr) => {
                          // Si es el último y hay un número impar, que ocupe todo el ancho
                          const isLast = idx === arr.length - 1 && arr.length % 2 !== 0;
                          const isSensitive = key === 'password' || key === 'urlInterna';
                          const show = !!showFields[key];
                          return (
                            <div
                              key={key}
                              className={`flex flex-col bg-zinc-900 rounded-md p-4 ${isLast ? 'md:col-span-2' : ''}`}
                            >
                              <span className="text-zinc-400 font-semibold mb-1">{key}:</span>
                              <div className="flex items-center gap-2">
                                <span className="text-zinc-200 break-all text-base bg-zinc-800 rounded px-3 py-1 select-all w-full block">
                                  {isSensitive && !show ? '••••••••' : String(value)}
                                </span>
                                {isSensitive && (
                                  <button
                                    className="bg-zinc-700 hover:bg-zinc-600 text-white px-2 py-1 rounded transition text-xs flex items-center gap-1"
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
              <p className="text-zinc-400">Cargando productos...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product, index) => (
                  <div
                    key={index}
                    className="bg-zinc-800 rounded-lg p-4 shadow-md flex flex-col h-full cursor-pointer hover:bg-zinc-700 transition"
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
              <p className="text-zinc-400">No hay productos disponibles.</p>
            )}
          </div>
        )}

        
      </div>

      {/* Modal */}
      {isModalOpen && selectedProduct && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          onClick={handleCloseModal}
        >
          <div
            className="bg-zinc-800 p-6 rounded-lg shadow-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4 text-white">Crear Nueva Instancia</h2>
            <p className="text-zinc-300 mb-4">
              Configura los detalles para la nueva instancia de{' '}
              <span className="font-bold">{selectedProduct.name}</span>
            </p>
            <div className="space-y-4">
              {selectedProduct.fields.map((field, index) => (
                <div key={index}>
                  {Object.entries(field).map(([key, value]) => (
                    <div key={key} className="mb-4">
                      <label className="block text-zinc-300 mb-1 capitalize">
                        {key.replace(/_/g, ' ')}
                      </label>
                      <input
                        type="text"
                        value={formValues[key] || ''}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        className="w-full bg-zinc-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                      />
                      {key === 'service_name' && (
                        <>
                          {/[A-Z]/.test(formValues[key] || '') && (
                            <p className="text-red-500 text-sm mt-1">
                              El nombre del servicio no debe contener mayúsculas.
                            </p>
                          )}
                          {(formValues[key] || '').trim() === 'n8n_free_treal' && (
                            <p className="text-red-500 text-sm mt-1">
                              El nombre <b>n8n_free_treal</b> está reservado por el sistema.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={handleCloseModal}
                className="bg-zinc-600 text-white px-4 py-2 rounded-md hover:bg-zinc-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition"
              >
                OK
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