'use client';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';
import Sidebard from '../../components/dashboard/index';
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  DocumentArrowUpIcon,
  PencilSquareIcon,
  PhotoIcon,
  Cog6ToothIcon,
  PlayIcon,
  StopIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface Instance {
  documentId: string;
  state: string;
  phoneNumber?: string;
  name?: string;
}

function SpamWhatsAppContent() {
  const { session, status } = useAuth();
  const router = useRouter();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState('');
  const [uploadMode, setUploadMode] = useState<'excel' | 'manual'>('excel');
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [manualNumbers, setManualNumbers] = useState('');
  const [validatedNumbers, setValidatedNumbers] = useState<{ valid: string[], invalid: string[] }>({ valid: [], invalid: [] });
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageOption, setImageOption] = useState<'url' | 'upload' | 'none'>('none');
  const [waitTime, setWaitTime] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [spamId, setSpamId] = useState<string | null>(null);
  const [spamStatus, setSpamStatus] = useState<any>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchInstances();
    }
  }, [status, router]);

  // Polling para actualizar el progreso
  useEffect(() => {
    if (!spamId || !isLoading) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await axios.get(`/api/templates/spam-control?spamId=${spamId}`);
        const statusData = res.data.status;

        if (statusData) {
          setSpamStatus(statusData);
          setProgress({
            current: statusData.currentContact,
            total: statusData.totalContacts,
          });

          if (statusData.stopped || statusData.completed) {
            clearInterval(pollInterval);
            setIsLoading(false);
            setShowSummaryModal(true);

            if (statusData.stopped) {
              toast.warning(`Envío detenido. ${statusData.success.length} enviados, ${statusData.errors.length} errores`);
            } else {
              toast.success(`¡Completado! ${statusData.success.length} enviados, ${statusData.errors.length} errores`);
            }
          }
        }
      } catch (error) {
        console.error('Error polling spam status:', error);
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [spamId, isLoading]);

  const fetchInstances = async () => {
    try {
      const res = await axios.get('/api/instances');
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
        if (file.size <= 5 * 1024 * 1024) {
          setImageFile(file);
          setImageUrl('');
        } else {
          toast.error('La imagen debe ser menor a 5MB');
        }
      } else {
        toast.error('Formato de imagen no válido');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting || isLoading) {
      toast.warning('Ya hay un envío en proceso');
      return;
    }

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

    setIsSubmitting(true);
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

      if (imageOption === 'url' && imageUrl) {
        formData.append('imageUrl', imageUrl);
      } else if (imageOption === 'upload' && imageFile) {
        formData.append('imageFile', imageFile);
      }

      formData.append('waitTime', waitTime.toString());

      const res = await axios.post('/api/templates/spam-whatsapp', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const receivedSpamId = res.data.spamId;
      setSpamId(receivedSpamId);
      setProgress({ current: 0, total: res.data.totalContacts });
      toast.success(`Enviando mensajes a ${res.data.totalContacts} contactos...`);

    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || 'Error al enviar mensajes');
      setIsLoading(false);
      setIsSubmitting(false);
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
    } catch (error) {
      toast.error('Error al detener el envío');
    }
  };

  const downloadReport = () => {
    if (!spamStatus) return;

    const now = new Date();
    const fecha = now.toLocaleDateString('es-ES');
    const hora = now.toLocaleTimeString('es-ES');

    let csvContent = '# REPORTE DE ENVIO MASIVO WHATSAPP\n';
    csvContent += `# Fecha: ${fecha}\n# Hora: ${hora}\n`;
    csvContent += `# Total Enviados: ${spamStatus.success.length}\n`;
    csvContent += `# Total Fallidos: ${spamStatus.errors.length}\n`;
    csvContent += 'Numero,Estado,Mensaje de Error,Fecha/Hora\n';

    spamStatus.success.forEach((numero: string) => {
      csvContent += `${numero},EXITOSO,,${fecha} ${hora}\n`;
    });

    spamStatus.errors.forEach((error: any) => {
      const errorMsg = (error.error || 'Error desconocido').replace(/"/g, '""');
      csvContent += `${error.number},FALLIDO,"${errorMsg}",${fecha} ${hora}\n`;
    });

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_whatsapp_${now.getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('📥 Reporte descargado');
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-transparent">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-transparent p-6 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/templates"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
              SPAM WhatsApp
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Envío masivo de mensajes a múltiples contactos
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Card Principal: Configuración de Envío */}
          <div className="bg-white dark:bg-[#1e293b] border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <PaperAirplaneIcon className="w-6 h-6 text-emerald-500" />
              Configuración de Envío
            </h2>

            {/* Selección de Instancia */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                1. Selecciona tu instancia
              </label>
              {instances.length === 0 ? (
                <div className="text-slate-500 dark:text-slate-400 text-sm bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  No tienes instancias conectadas.{' '}
                  <Link href="/instances" className="text-emerald-500 hover:text-emerald-600 font-medium">
                    Conecta una instancia
                  </Link>
                </div>
              ) : (
                <select
                  value={selectedInstance}
                  onChange={(e) => setSelectedInstance(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
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
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                2. Método de carga de contactos
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setUploadMode('excel');
                    setManualNumbers('');
                  }}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 ${uploadMode === 'excel'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10'
                    : 'border-slate-200 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800'
                    }`}
                >
                  <div className={`p-3 rounded-xl ${uploadMode === 'excel' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    <DocumentArrowUpIcon className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className={`font-bold ${uploadMode === 'excel' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      Archivo Excel
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Sube un .xlsx o .xls</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUploadMode('manual');
                    setExcelFile(null);
                  }}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 ${uploadMode === 'manual'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10'
                    : 'border-slate-200 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800'
                    }`}
                >
                  <div className={`p-3 rounded-xl ${uploadMode === 'manual' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    <PencilSquareIcon className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className={`font-bold ${uploadMode === 'manual' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      Entrada Manual
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Pega o escribe números</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Área de Carga (Excel o Manual) */}
            <div className="mb-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
              {uploadMode === 'excel' ? (
                <div>
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center hover:border-emerald-500 transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center">
                      <DocumentArrowUpIcon className="w-12 h-12 text-slate-400 mb-3" />
                      {excelFile ? (
                        <div>
                          <p className="text-emerald-600 dark:text-emerald-400 font-medium">{excelFile.name}</p>
                          <p className="text-xs text-slate-500">{(excelFile.size / 1024).toFixed(2)} KB</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-slate-600 dark:text-slate-300 font-medium">Click para subir o arrastra aquí</p>
                          <p className="text-xs text-slate-400 mt-1">Formato: Columna 'numero' requerida</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <textarea
                    value={manualNumbers}
                    onChange={(e) => {
                      const input = e.target.value;
                      setManualNumbers(input);
                      const lines = input.split('\n').filter(l => l.trim());
                      const valid: string[] = [];
                      const invalid: string[] = [];
                      lines.forEach(line => {
                        const cleaned = line.replace(/[^0-9]/g, '');
                        if (cleaned.length >= 8 && cleaned.length <= 15) valid.push(cleaned);
                        else if (cleaned.length > 0) invalid.push(line.trim());
                      });
                      setValidatedNumbers({ valid, invalid });
                    }}
                    placeholder={"Pegar números aquí...\n+51 956 565 656\n573001234567"}
                    rows={6}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                  />
                  <div className="flex justify-between mt-2 text-xs">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      ✅ {validatedNumbers.valid.length} válidos
                    </span>
                    {validatedNumbers.invalid.length > 0 && (
                      <span className="text-red-500 font-medium">
                        ❌ {validatedNumbers.invalid.length} inválidos
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mensaje e Imagen */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  3. Mensaje
                </label>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-3 mb-3">
                  <p className="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2">
                    <SparklesIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Tip:</strong> Usa variables dinámicas como <code>{`{{nombre}}`}</code> o <code>{`{{pedido}}`}</code>.
                      El sistema las reemplazará automáticamente con los datos de tu Excel.
                    </span>
                  </p>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hola {{nombre}}, tu pedido {{pedido}} está listo..."
                  rows={5}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  4. Imagen (Opcional)
                </label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setImageOption('none')}
                    className={`flex-1 py-1.5 text-xs rounded-lg transition ${imageOption === 'none' ? 'bg-slate-200 dark:bg-slate-700 font-bold' : 'bg-slate-50 dark:bg-slate-800'}`}
                  >
                    Ninguna
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageOption('url')}
                    className={`flex-1 py-1.5 text-xs rounded-lg transition ${imageOption === 'url' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 font-bold' : 'bg-slate-50 dark:bg-slate-800'}`}
                  >
                    URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageOption('upload')}
                    className={`flex-1 py-1.5 text-xs rounded-lg transition ${imageOption === 'upload' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 font-bold' : 'bg-slate-50 dark:bg-slate-800'}`}
                  >
                    Subir
                  </button>
                </div>

                {imageOption === 'url' && (
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                )}

                {imageOption === 'upload' && (
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-4 text-center relative hover:border-emerald-500 transition">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <PhotoIcon className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-500">{imageFile ? imageFile.name : 'Subir imagen'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Configuración Avanzada */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Cog6ToothIcon className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Espera entre mensajes</span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={waitTime}
                  onChange={(e) => setWaitTime(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg font-mono text-sm font-bold text-emerald-600">
                  {waitTime}s
                </span>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex gap-4">
              {!isLoading ? (
                <>
                  <button
                    type="button"
                    onClick={() => router.push('/templates')}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 px-6 rounded-xl transition-all font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || isLoading || instances.length === 0 || (uploadMode === 'excel' && !excelFile) || (uploadMode === 'manual' && !manualNumbers.trim())}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg hover:shadow-emerald-500/25 text-white py-3 px-6 rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-medium flex items-center justify-center gap-2"
                  >
                    <PaperAirplaneIcon className="w-5 h-5" />
                    {isSubmitting ? 'Procesando...' : 'Iniciar Envío Masivo'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleStopSpam}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-xl transition-all shadow-lg shadow-red-500/25 font-bold flex items-center justify-center gap-2 animate-pulse"
                >
                  <StopIcon className="w-6 h-6" />
                  DETENER ENVÍO
                </button>
              )}
            </div>
          </div>

          {/* Progreso del Envío */}
          {isLoading && progress.total > 0 && (
            <div className="bg-white dark:bg-[#1e293b] border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-lg ring-1 ring-emerald-500/20">
              <div className="flex justify-between mb-2">
                <span className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                  Enviando mensajes...
                </span>
                <span className="font-mono text-emerald-600 font-bold">
                  {progress.current} / {progress.total}
                </span>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-4 mb-6 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-400 to-teal-500 h-4 rounded-full transition-all duration-500 flex items-center justify-center text-[10px] text-white font-bold shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                >
                  {Math.round((progress.current / progress.total) * 100)}%
                </div>
              </div>

              {spamStatus && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 p-4 rounded-2xl text-center">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{spamStatus.success.length}</div>
                    <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Exitosos</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 p-4 rounded-2xl text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{spamStatus.errors.length}</div>
                    <div className="text-xs text-red-700 dark:text-red-300 font-medium">Fallidos</div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 p-4 rounded-2xl text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{progress.total - progress.current}</div>
                    <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">Pendientes</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </div>

      {/* Modal de Resumen */}
      {showSummaryModal && spamStatus && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 dark:border-slate-800 transform transition-all scale-100">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {spamStatus.completed ? <CheckCircleIcon className="w-8 h-8" /> : <ExclamationTriangleIcon className="w-8 h-8" />}
                {spamStatus.completed ? '¡Envío Completado!' : 'Envío Detenido'}
              </h2>
              <p className="text-emerald-100 mt-1 opacity-90">Resumen de la campaña</p>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-800/30">
                  <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">{spamStatus.success.length}</div>
                  <div className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Mensajes Enviados</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-5 border border-red-100 dark:border-red-800/30">
                  <div className="text-4xl font-bold text-red-600 dark:text-red-400 mb-1">{spamStatus.errors.length}</div>
                  <div className="text-sm text-red-700 dark:text-red-300 font-medium">Errores</div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={downloadReport}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/25 font-medium flex items-center justify-center gap-2"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  Descargar Reporte
                </button>
                <button
                  onClick={() => {
                    setShowSummaryModal(false);
                    router.push('/templates');
                  }}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 px-6 rounded-xl transition-all font-medium"
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
    </Sidebard>
  );
}
