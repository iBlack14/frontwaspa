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
}

function SpamWhatsAppContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState('');
  const [uploadMode, setUploadMode] = useState<'excel' | 'manual'>('excel');
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [manualNumbers, setManualNumbers] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageOption, setImageOption] = useState<'url' | 'upload' | 'none'>('none');
  const [waitTime, setWaitTime] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [spamId, setSpamId] = useState<string | null>(null);
  const [spamStatus, setSpamStatus] = useState<any>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

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

  // Polling para actualizar el progreso en tiempo real
  useEffect(() => {
    if (!spamId || !isLoading) return;

    console.log('[FRONTEND] Iniciando polling para spamId:', spamId);

    const pollInterval = setInterval(async () => {
      try {
        const res = await axios.get(`/api/templates/spam-control?spamId=${spamId}`);
        const status = res.data.status;
        
        console.log('[FRONTEND] Estado recibido:', status);
        
        if (status) {
          setSpamStatus(status);
          setProgress({
            current: status.currentContact,
            total: status.totalContacts,
          });

          // Si el envío terminó (detenido o completado)
          if (status.stopped || status.completed) {
            console.log('[FRONTEND] Envío finalizado:', { stopped: status.stopped, completed: status.completed });
            clearInterval(pollInterval);
            setIsLoading(false);
            
            // Mostrar modal de resumen
            setShowSummaryModal(true);
            
            if (status.stopped) {
              toast.warning(`Envío detenido. ${status.success.length} enviados, ${status.errors.length} errores`);
            } else {
              toast.success(`¡Completado! ${status.success.length} enviados, ${status.errors.length} errores`);
            }
          }
        } else {
          console.warn('[FRONTEND] No se recibió estado del servidor');
        }
      } catch (error: any) {
        console.error('[FRONTEND] Error polling spam status:', error);
        console.error('[FRONTEND] Error details:', error.response?.data);
      }
    }, 1000); // Actualizar cada segundo

    return () => clearInterval(pollInterval);
  }, [spamId, isLoading, router]);

  const fetchInstances = async () => {
    try {
      const res = await axios.get('/api/instances');
      
      // Mapear correctamente los datos desde Supabase
      const mappedInstances = res.data.instances.map((item: any) => ({
        documentId: item.document_id || item.documentId,
        state: item.state,
        phoneNumber: item.phone_number || item.phoneNumber,
        name: item.profile_name || item.name || 'Instancia',
      }));
      
      const connectedInstances = mappedInstances.filter(
        (i: Instance) => i.state === 'Connected'
      );
      
      setInstances(connectedInstances);
      if (connectedInstances.length > 0) {
        setSelectedInstance(connectedInstances[0].documentId);
      }
    } catch (error) {
      console.error('Error fetching instances:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setExcelFile(file);
      } else {
        toast.error('Por favor sube un archivo Excel (.xlsx o .xls)');
      }
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      
      if (validTypes.includes(file.type)) {
        if (file.size <= 5 * 1024 * 1024) { // Max 5MB
          setImageFile(file);
          setImageUrl(''); // Limpiar URL si había
        } else {
          toast.error('La imagen debe ser menor a 5MB');
        }
      } else {
        toast.error('Formato de imagen no válido. Usa JPG, PNG, GIF o WebP');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInstance) {
      toast.error('Selecciona una instancia conectada');
      return;
    }

    if (uploadMode === 'excel' && !excelFile) {
      toast.error('Sube un archivo Excel');
      return;
    }

    if (uploadMode === 'manual' && !manualNumbers.trim()) {
      toast.error('Ingresa al menos un número');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('uploadMode', uploadMode);
      
      if (uploadMode === 'excel') {
        formData.append('file', excelFile!);
      } else {
        formData.append('manualNumbers', manualNumbers);
      }
      
      formData.append('instanceId', selectedInstance);
      formData.append('message', message);
      
      // Agregar imagen (URL o archivo)
      if (imageOption === 'url' && imageUrl) {
        formData.append('imageUrl', imageUrl);
      } else if (imageOption === 'upload' && imageFile) {
        formData.append('imageFile', imageFile);
      }
      
      formData.append('waitTime', waitTime.toString());

      const res = await axios.post('/api/templates/spam-whatsapp', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
          }
        },
      });

      // Guardar spamId y configurar progreso inicial
      const receivedSpamId = res.data.spamId;
      console.log('[FRONTEND] SpamId recibido:', receivedSpamId);
      console.log('[FRONTEND] Total contactos:', res.data.totalContacts);
      
      setSpamId(receivedSpamId);
      setProgress({ current: 0, total: res.data.totalContacts });
      toast.success(`Enviando mensajes a ${res.data.totalContacts} contactos...`);
      
      // El polling se encargará de actualizar el progreso
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || 'Error al enviar mensajes');
      setIsLoading(false);
      setSpamId(null);
    }
  };

  const handleStopSpam = async () => {
    if (!spamId) return;

    try {
      await axios.post('/api/templates/spam-control', {
        action: 'stop',
        spamId,
      });
      
      toast.info('Deteniendo envío...');
    } catch (error: any) {
      console.error('Error stopping spam:', error);
      toast.error('Error al detener el envío');
    }
  };

  const downloadReport = () => {
    if (!spamStatus) return;

    const now = new Date();
    const fecha = now.toLocaleDateString('es-ES');
    const hora = now.toLocaleTimeString('es-ES');
    
    // Crear CSV con encabezado mejorado
    let csvContent = '# REPORTE DE ENVIO MASIVO WHATSAPP\n';
    csvContent += `# Fecha: ${fecha}\n`;
    csvContent += `# Hora: ${hora}\n`;
    csvContent += `# Total Enviados: ${spamStatus.success.length}\n`;
    csvContent += `# Total Fallidos: ${spamStatus.errors.length}\n`;
    csvContent += `# Total Procesados: ${spamStatus.totalContacts}\n`;
    csvContent += `# Estado: ${spamStatus.completed ? 'Completado' : spamStatus.stopped ? 'Detenido' : 'En Proceso'}\n`;
    csvContent += '#\n';
    csvContent += 'Numero,Estado,Mensaje de Error,Fecha/Hora\n';
    
    // Agregar exitosos
    spamStatus.success.forEach((numero: string) => {
      csvContent += `${numero},EXITOSO,,${fecha} ${hora}\n`;
    });
    
    // Agregar fallidos
    spamStatus.errors.forEach((error: any) => {
      const errorMsg = (error.error || 'Error desconocido').replace(/"/g, '""'); // Escapar comillas
      csvContent += `${error.number},FALLIDO,"${errorMsg}",${fecha} ${hora}\n`;
    });

    // Descargar con BOM para UTF-8
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_whatsapp_${now.getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('📥 Reporte descargado correctamente');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/templates"
                className="text-emerald-500 hover:text-emerald-400 transition"
              >
                ← Volver
              </Link>
              <h1 className="text-2xl font-bold">📨 SPAM WhatsApp</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleccionar Instancia */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <label className="block text-sm font-medium mb-2">
              Selecciona tu instancia de WhatsApp
            </label>
            {instances.length === 0 ? (
              <div className="text-zinc-400 text-sm">
                No tienes instancias conectadas.{' '}
                <Link href="/instances" className="text-emerald-500 hover:underline">
                  Conecta una instancia
                </Link>
              </div>
            ) : (
              <select
                value={selectedInstance}
                onChange={(e) => setSelectedInstance(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {instances.map((instance) => (
                  <option key={instance.documentId} value={instance.documentId}>
                    {instance.name || 'Instancia'} - {instance.phoneNumber || 'Sin número'}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Modo de Carga */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <label className="block text-sm font-medium mb-4">
              ¿Cómo quieres cargar los contactos?
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setUploadMode('excel');
                  setManualNumbers('');
                }}
                className={`flex-1 py-3 px-4 rounded-md transition border-2 ${
                  uploadMode === 'excel'
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                }`}
              >
                <div className="text-3xl mb-1">📊</div>
                <div className="font-semibold">Archivo Excel</div>
                <div className="text-xs opacity-75 mt-1">Sube un .xlsx o .xls</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadMode('manual');
                  setExcelFile(null);
                }}
                className={`flex-1 py-3 px-4 rounded-md transition border-2 ${
                  uploadMode === 'manual'
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                }`}
              >
                <div className="text-3xl mb-1">✍️</div>
                <div className="font-semibold">Entrada Manual</div>
                <div className="text-xs opacity-75 mt-1">Pega o escribe números</div>
              </button>
            </div>
          </div>

          {/* Subir Excel */}
          {uploadMode === 'excel' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <label className="block text-sm font-medium mb-2">
                Sube tu archivo Excel
              </label>
              <p className="text-zinc-400 text-sm mb-4">
                El Excel debe tener una columna llamada <code className="bg-zinc-800 px-2 py-1 rounded">numero</code>
              </p>
              <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center hover:border-emerald-500 transition">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="excel-upload"
                />
                <label htmlFor="excel-upload" className="cursor-pointer">
                  <div className="text-4xl mb-2">📎</div>
                  {excelFile ? (
                    <p className="text-emerald-500">{excelFile.name}</p>
                  ) : (
                    <p className="text-zinc-400">Click para subir o arrastra aquí</p>
                  )}
                </label>
              </div>
              <div className="mt-4 bg-zinc-800 rounded p-3">
                <p className="text-xs text-zinc-400 mb-1">💡 Formato del Excel:</p>
                <div className="font-mono text-xs text-emerald-400">
                  <div>numero | mensaje (opcional) | imagen (opcional)</div>
                  <div className="text-zinc-500">573001234567 | Hola! | https://...</div>
                </div>
              </div>
            </div>
          )}

          {/* Entrada Manual */}
          {uploadMode === 'manual' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <label className="block text-sm font-medium mb-2">
                Números de WhatsApp
              </label>
              <p className="text-zinc-400 text-sm mb-4">
                Ingresa un número por línea. Incluye el código de país sin + ni espacios.
              </p>
              <textarea
                value={manualNumbers}
                onChange={(e) => setManualNumbers(e.target.value)}
                placeholder={"Ejemplo:\n573001234567\n573009876543\n573111222333"}
                rows={8}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
              />
              <div className="mt-3 flex justify-between items-center">
                <p className="text-zinc-400 text-xs">
                  📝 {manualNumbers.split('\n').filter(n => n.trim()).length} números detectados
                </p>
                <button
                  type="button"
                  onClick={() => setManualNumbers('')}
                  className="text-red-500 hover:text-red-400 text-xs underline"
                >
                  Limpiar todo
                </button>
              </div>
              <div className="mt-4 bg-zinc-800 rounded p-3">
                <p className="text-xs text-zinc-400 mb-1">💡 Formatos válidos:</p>
                <div className="font-mono text-xs text-emerald-400">
                  <div>✅ 573001234567</div>
                  <div>✅ 521234567890</div>
                  <div className="text-red-400">❌ +57 300 123 4567 (elimina + y espacios)</div>
                </div>
              </div>
            </div>
          )}

          {/* Mensaje */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <label className="block text-sm font-medium mb-2">
              Mensaje (opcional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              rows={4}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Imagen */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <label className="block text-sm font-medium mb-4">
              Imagen (opcional)
            </label>
            
            {/* Selector de tipo de imagen */}
            <div className="flex gap-4 mb-4">
              <button
                type="button"
                onClick={() => {
                  setImageOption('none');
                  setImageUrl('');
                  setImageFile(null);
                }}
                className={`flex-1 py-2 px-4 rounded-md transition ${
                  imageOption === 'none'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                Sin imagen
              </button>
              <button
                type="button"
                onClick={() => setImageOption('url')}
                className={`flex-1 py-2 px-4 rounded-md transition ${
                  imageOption === 'url'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                URL
              </button>
              <button
                type="button"
                onClick={() => setImageOption('upload')}
                className={`flex-1 py-2 px-4 rounded-md transition ${
                  imageOption === 'upload'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                Subir archivo
              </button>
            </div>

            {/* Input URL */}
            {imageOption === 'url' && (
              <div>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.png"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            {/* Upload File */}
            {imageOption === 'upload' && (
              <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center hover:border-emerald-500 transition">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleImageFileChange}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="text-4xl mb-2">🖼️</div>
                  {imageFile ? (
                    <div>
                      <p className="text-emerald-500 mb-1">{imageFile.name}</p>
                      <p className="text-zinc-400 text-xs">
                        {(imageFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-zinc-400">Click para subir o arrastra aquí</p>
                      <p className="text-zinc-500 text-xs mt-1">
                        JPG, PNG, GIF, WebP (máx. 5MB)
                      </p>
                    </div>
                  )}
                </label>
              </div>
            )}
          </div>

          {/* Configuración Avanzada */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">⚙️ Configuración Avanzada</h3>
            <div>
              <label className="block text-sm font-medium mb-2">
                Espera entre mensajes (segundos)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={waitTime}
                onChange={(e) => setWaitTime(parseInt(e.target.value))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-zinc-400 text-xs mt-1">
                Recomendado: 3-5 segundos para evitar bloqueos
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            {!isLoading ? (
              <>
                <button
                  type="button"
                  onClick={() => router.push('/templates')}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 px-6 rounded-md transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading || instances.length === 0 || (uploadMode === 'excel' && !excelFile) || (uploadMode === 'manual' && !manualNumbers.trim())}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-6 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Iniciar Envío 🚀
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleStopSpam}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-md transition font-bold flex items-center justify-center gap-2"
              >
                🛑 DETENER ENVÍO
              </button>
            )}
          </div>

          {/* Progress */}
          {isLoading && progress.total > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <div className="flex justify-between mb-2">
                <span className="font-semibold">Progreso del Envío</span>
                <span className="font-mono">
                  {progress.current} / {progress.total}
                </span>
              </div>
              
              {/* Último número procesado */}
              {spamStatus && (spamStatus.success.length > 0 || spamStatus.errors.length > 0) && (
                <div className="mb-3 text-xs text-zinc-400 flex items-center gap-2">
                  <span className="animate-pulse">⚡</span>
                  <span>
                    Último procesado: 
                    {spamStatus.success.length > 0 && (
                      <span className="text-emerald-400 ml-1">
                        +{spamStatus.success[spamStatus.success.length - 1]}
                      </span>
                    )}
                    {spamStatus.errors.length > 0 && spamStatus.success.length === 0 && (
                      <span className="text-red-400 ml-1">
                        +{spamStatus.errors[spamStatus.errors.length - 1].number}
                      </span>
                    )}
                  </span>
                </div>
              )}
              
              {/* Barra de progreso */}
              <div className="w-full bg-zinc-800 rounded-full h-4 mb-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-4 rounded-full transition-all duration-500 flex items-center justify-center text-xs text-white font-bold"
                  style={{
                    width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                  }}
                >
                  {progress.total > 0 && Math.round((progress.current / progress.total) * 100)}%
                </div>
              </div>

              {/* Estadísticas detalladas */}
              {spamStatus && (
                <>
                  <div className="grid grid-cols-3 gap-4 text-center mb-6">
                    <div className="bg-zinc-800 p-3 rounded">
                      <div className="text-2xl font-bold text-emerald-500">
                        {spamStatus.success.length}
                      </div>
                      <div className="text-xs text-zinc-400">Exitosos</div>
                    </div>
                    <div className="bg-zinc-800 p-3 rounded">
                      <div className="text-2xl font-bold text-red-500">
                        {spamStatus.errors.length}
                      </div>
                      <div className="text-xs text-zinc-400">Errores</div>
                    </div>
                    <div className="bg-zinc-800 p-3 rounded">
                      <div className="text-2xl font-bold text-blue-500">
                        {progress.total - progress.current}
                      </div>
                      <div className="text-xs text-zinc-400">Pendientes</div>
                    </div>
                  </div>

                  {/* Detalles de Números Enviados */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Números Exitosos */}
                    {spamStatus.success.length > 0 && (
                      <div className="bg-zinc-800 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-emerald-500 mb-2 flex items-center gap-2">
                          ✅ Enviados ({spamStatus.success.length})
                        </h4>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {spamStatus.success.map((numero: string, idx: number) => (
                            <div key={idx} className="text-xs font-mono text-zinc-300 bg-zinc-900 px-2 py-1 rounded flex items-center gap-2">
                              <span className="text-emerald-500">●</span>
                              <span>+{numero}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Números con Error */}
                    {spamStatus.errors.length > 0 && (
                      <div className="bg-zinc-800 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-red-500 mb-2 flex items-center gap-2">
                          ❌ Fallidos ({spamStatus.errors.length})
                        </h4>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {spamStatus.errors.map((error: any, idx: number) => (
                            <div key={idx} className="text-xs bg-zinc-900 px-2 py-1 rounded">
                              <div className="font-mono text-red-400 flex items-center gap-2">
                                <span className="text-red-500">●</span>
                                <span>+{error.number}</span>
                              </div>
                              <div className="text-zinc-500 text-[10px] ml-4 mt-0.5 truncate" title={error.error}>
                                {error.error}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Estado */}
              <div className="mt-4 text-center">
                <p className="text-zinc-400 text-sm mb-3">
                  {spamStatus?.stopped 
                    ? '🛑 Envío detenido por el usuario' 
                    : spamStatus?.completed
                    ? '✅ Envío completado'
                    : '⏳ Enviando mensajes...'}
                </p>
                
                {/* Botón Descargar Reporte */}
                {(spamStatus?.completed || spamStatus?.stopped) && (
                  <button
                    type="button"
                    onClick={downloadReport}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm transition inline-flex items-center gap-2"
                  >
                    📊 Descargar Reporte CSV
                  </button>
                )}
              </div>
              
              {/* Debug Info */}
              <details className="mt-4 text-xs text-zinc-500">
                <summary className="cursor-pointer hover:text-zinc-300">🔍 Info de Debug</summary>
                <div className="mt-2 bg-zinc-950 p-3 rounded font-mono overflow-auto max-h-40">
                  <div>SpamId: {spamId}</div>
                  <div>Estado recibido: {spamStatus ? '✅' : '❌'}</div>
                  {spamStatus && (
                    <>
                      <div>Current: {spamStatus.currentContact}</div>
                      <div>Total: {spamStatus.totalContacts}</div>
                      <div>Stopped: {spamStatus.stopped ? 'Sí' : 'No'}</div>
                      <div>Completed: {spamStatus.completed ? 'Sí' : 'No'}</div>
                    </>
                  )}
                </div>
              </details>
            </div>
          )}
        </form>
      </div>

      {/* Modal de Resumen Final */}
      {showSummaryModal && spamStatus && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border-2 border-emerald-500 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">
                    {spamStatus.completed ? '✅ Envío Completado' : '🛑 Envío Detenido'}
                  </h2>
                  <p className="text-emerald-100 text-sm">
                    Resumen detallado de la campaña
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowSummaryModal(false);
                    router.push('/templates');
                  }}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Estadísticas Generales */}
            <div className="p-6 border-b border-zinc-800">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-zinc-800 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-white mb-1">
                    {spamStatus.totalContacts}
                  </div>
                  <div className="text-xs text-zinc-400">Total Procesados</div>
                </div>
                <div className="bg-emerald-900/30 border border-emerald-600 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-emerald-400 mb-1">
                    {spamStatus.success.length}
                  </div>
                  <div className="text-xs text-emerald-300">Exitosos</div>
                  <div className="text-xs text-emerald-500 mt-1">
                    {Math.round((spamStatus.success.length / spamStatus.totalContacts) * 100)}% éxito
                  </div>
                </div>
                <div className="bg-red-900/30 border border-red-600 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-red-400 mb-1">
                    {spamStatus.errors.length}
                  </div>
                  <div className="text-xs text-red-300">Fallidos</div>
                  <div className="text-xs text-red-500 mt-1">
                    {Math.round((spamStatus.errors.length / spamStatus.totalContacts) * 100)}% error
                  </div>
                </div>
              </div>
            </div>

            {/* Listas Detalladas */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Números Exitosos */}
                <div>
                  <h3 className="text-emerald-500 font-semibold mb-3 flex items-center gap-2">
                    <span className="bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                      {spamStatus.success.length}
                    </span>
                    Mensajes Enviados
                  </h3>
                  <div className="bg-zinc-800 rounded-lg p-3 max-h-64 overflow-y-auto">
                    {spamStatus.success.length > 0 ? (
                      <div className="space-y-1">
                        {spamStatus.success.map((numero: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-xs bg-zinc-900 px-3 py-2 rounded">
                            <span className="text-emerald-500">✓</span>
                            <span className="font-mono text-zinc-300">+{numero}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-zinc-500 text-sm text-center py-4">No hay mensajes exitosos</p>
                    )}
                  </div>
                </div>

                {/* Números Fallidos */}
                <div>
                  <h3 className="text-red-500 font-semibold mb-3 flex items-center gap-2">
                    <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                      {spamStatus.errors.length}
                    </span>
                    Mensajes Fallidos
                  </h3>
                  <div className="bg-zinc-800 rounded-lg p-3 max-h-64 overflow-y-auto">
                    {spamStatus.errors.length > 0 ? (
                      <div className="space-y-2">
                        {spamStatus.errors.map((error: any, idx: number) => (
                          <div key={idx} className="bg-zinc-900 px-3 py-2 rounded">
                            <div className="flex items-center gap-2 text-xs mb-1">
                              <span className="text-red-500">✗</span>
                              <span className="font-mono text-red-400">+{error.number}</span>
                            </div>
                            <div className="text-[10px] text-zinc-500 ml-5 truncate" title={error.error}>
                              {error.error}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-zinc-500 text-sm text-center py-4">¡Todos los mensajes fueron exitosos! 🎉</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer con acciones */}
            <div className="p-6 border-t border-zinc-800 bg-zinc-900/50">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={downloadReport}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Descargar CSV
                </button>
                <button
                  onClick={() => {
                    setShowSummaryModal(false);
                    router.push('/templates');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-md transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SpamWhatsApp() {
  return (
    <Sidebard>
      <SpamWhatsAppContent />
      <Toaster position="top-right" />
    </Sidebard>
  );
}
