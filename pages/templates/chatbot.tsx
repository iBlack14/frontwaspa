import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';
import Sidebard from '../../components/dashboard/index';
import {
  ArrowLeftIcon,
  SparklesIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  EyeIcon,
  PlusIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface Instance {
  documentId: string;
  state: string;
  phoneNumber?: string;
  name?: string;
}

interface ChatbotRule {
  id: string;
  trigger: string;
  response: string;
  isActive: boolean;
}

function ChatbotContent() {
  const { session, status } = useAuth();
  const router = useRouter();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState('');
  const [chatbotName, setChatbotName] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [defaultResponse, setDefaultResponse] = useState('');
  const [rules, setRules] = useState<ChatbotRule[]>([]);
  const [newTrigger, setNewTrigger] = useState('');
  const [newResponse, setNewResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'rules' | 'preview'>('config');
  const [chatbotActive, setChatbotActive] = useState(false); // Estado del chatbot

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

  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // ... (existing useEffects)

  const addRule = () => {
    if (!newTrigger.trim() || !newResponse.trim()) {
      toast.error('Completa el disparador y la respuesta');
      return;
    }

    if (editingRuleId) {
      setRules(rules.map(r =>
        r.id === editingRuleId
          ? { ...r, trigger: newTrigger.trim(), response: newResponse.trim() }
          : r
      ));
      setEditingRuleId(null);
      toast.success('Regla actualizada');
    } else {
      const rule: ChatbotRule = {
        id: Date.now().toString(),
        trigger: newTrigger.trim(),
        response: newResponse.trim(),
        isActive: true,
      };
      setRules([...rules, rule]);
      toast.success('Regla agregada');
    }

    setNewTrigger('');
    setNewResponse('');
  };

  const startEditing = (rule: ChatbotRule) => {
    setNewTrigger(rule.trigger);
    setNewResponse(rule.response);
    setEditingRuleId(rule.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setNewTrigger('');
    setNewResponse('');
    setEditingRuleId(null);
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
    if (editingRuleId === id) {
      cancelEditing();
    }
    toast.success('Regla eliminada');
  };

  const toggleRule = (id: string) => {
    setRules(rules.map(r =>
      r.id === id ? { ...r, isActive: !r.isActive } : r
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInstance) {
      toast.error('Selecciona una instancia');
      return;
    }

    if (!chatbotName.trim()) {
      toast.error('Ingresa un nombre para el chatbot');
      return;
    }

    if (rules.length === 0) {
      toast.error('Agrega al menos una regla');
      return;
    }

    setIsLoading(true);

    try {
      const res = await axios.post('/api/templates/chatbot', {
        instanceId: selectedInstance,
        chatbotName,
        welcomeMessage,
        defaultResponse,
        rules: rules.filter(r => r.isActive),
      });

      toast.success('¡Chatbot configurado exitosamente!');
      setChatbotActive(true);

      // Opcional: redirigir o limpiar formulario
      setTimeout(() => {
        router.push('/templates');
      }, 2000);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || 'Error al configurar chatbot');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplate = (templateName: string) => {
    switch (templateName) {
      case 'soporte':
        setChatbotName('Bot de Soporte');
        setWelcomeMessage('¡Hola! 👋 Soy el asistente virtual. ¿En qué puedo ayudarte hoy?');
        setDefaultResponse('Lo siento, no entendí tu mensaje. ¿Podrías reformularlo? O escribe "ayuda" para ver las opciones disponibles.');
        setRules([
          { id: '1', trigger: 'hola|hi|buenos dias|buenas tardes', response: '¡Hola! 😊 ¿En qué puedo ayudarte?', isActive: true },
          { id: '2', trigger: 'ayuda|help|opciones', response: 'Puedo ayudarte con:\n1️⃣ Información de productos\n2️⃣ Estado de pedidos\n3️⃣ Soporte técnico\n4️⃣ Hablar con un humano', isActive: true },
          { id: '3', trigger: 'productos|catalogo', response: 'Visita nuestro catálogo: https://ejemplo.com/productos', isActive: true },
          { id: '4', trigger: 'pedido|orden|tracking', response: 'Para consultar tu pedido, envíame tu número de orden.', isActive: true },
          { id: '5', trigger: 'humano|persona|agente', response: 'Te estoy conectando con un agente humano. Por favor espera un momento...', isActive: true },
        ]);
        toast.success('Template de Soporte cargado');
        break;

      case 'ventas':
        setChatbotName('Bot de Ventas');
        setWelcomeMessage('¡Bienvenido! 🎉 Estoy aquí para ayudarte a encontrar el producto perfecto.');
        setDefaultResponse('¿Necesitas ayuda? Escribe "menu" para ver nuestras opciones.');
        setRules([
          { id: '1', trigger: 'hola|hi', response: '¡Hola! 👋 ¿Buscas algo en especial?', isActive: true },
          { id: '2', trigger: 'menu|opciones', response: '📋 Menú:\n1️⃣ Ver productos\n2️⃣ Ofertas\n3️⃣ Hacer pedido\n4️⃣ Métodos de pago', isActive: true },
          { id: '3', trigger: 'productos', response: 'Tenemos:\n✨ Producto A - $100\n✨ Producto B - $200\n✨ Producto C - $300', isActive: true },
          { id: '4', trigger: 'ofertas|descuentos', response: '🎁 ¡Ofertas especiales!\n- 20% en Producto A\n- 2x1 en Producto B', isActive: true },
          { id: '5', trigger: 'pago|precio', response: 'Aceptamos:\n💳 Tarjetas\n💵 Efectivo\n📱 Transferencia', isActive: true },
        ]);
        toast.success('Template de Ventas cargado');
        break;

      case 'restaurante':
        setChatbotName('Bot de Restaurante');
        setWelcomeMessage('¡Bienvenido a nuestro restaurante! 🍽️ ¿Qué te gustaría ordenar hoy?');
        setDefaultResponse('No entendí tu pedido. Escribe "menu" para ver nuestras opciones.');
        setRules([
          { id: '1', trigger: 'hola|hi', response: '¡Hola! 😊 ¿Listo para ordenar?', isActive: true },
          { id: '2', trigger: 'menu|carta', response: '📋 Menú:\n🍕 Pizzas\n🍔 Hamburguesas\n🍝 Pastas\n🥗 Ensaladas\n🍰 Postres', isActive: true },
          { id: '3', trigger: 'pizza', response: '🍕 Pizzas disponibles:\n- Margarita $15\n- Pepperoni $18\n- Hawaiana $17', isActive: true },
          { id: '4', trigger: 'hamburguesa', response: '🍔 Hamburguesas:\n- Clásica $12\n- Doble $16\n- Vegana $14', isActive: true },
          { id: '5', trigger: 'delivery|domicilio', response: '🚚 Hacemos delivery! Tiempo estimado: 30-45 min. Costo: $3', isActive: true },
        ]);
        toast.success('Template de Restaurante cargado');
        break;
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-transparent">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-transparent p-6 sm:p-8">


      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link
              href="/templates"
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
                Chatbot IA
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Configura respuestas automáticas inteligentes
              </p>
            </div>
          </div>

          {/* Estado del Chatbot */}
          {chatbotActive && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    Chatbot Activo
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-500">
                    Respondiendo automáticamente
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 bg-white dark:bg-[#1e293b] rounded-2xl p-1 shadow-sm border border-slate-100 dark:border-slate-800 inline-flex">
        <button
          onClick={() => setActiveTab('config')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-300 ${activeTab === 'config'
            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
        >
          <Cog6ToothIcon className="w-5 h-5" />
          Configuración
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-300 ${activeTab === 'rules'
            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
        >
          <DocumentTextIcon className="w-5 h-5" />
          Reglas ({rules.length})
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-300 ${activeTab === 'preview'
            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
        >
          <EyeIcon className="w-5 h-5" />
          Vista Previa
        </button>
      </div>

      {/* Content */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Tab: Configuración */}
        {activeTab === 'config' && (
          <>
            {/* Templates Rápidos */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-xl">
                  <SparklesIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  Templates Rápidos
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => loadTemplate('soporte')}
                  className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 border border-blue-100 dark:border-blue-800/30 p-5 rounded-2xl text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:shadow-blue-500/10"
                >
                  <div className="text-3xl mb-2">🛠️</div>
                  <div className="font-bold text-slate-800 dark:text-white mb-1">Soporte</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Bot de atención al cliente</div>
                </button>
                <button
                  type="button"
                  onClick={() => loadTemplate('ventas')}
                  className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border border-emerald-100 dark:border-emerald-800/30 p-5 rounded-2xl text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:shadow-emerald-500/10"
                >
                  <div className="text-3xl mb-2">💰</div>
                  <div className="font-bold text-slate-800 dark:text-white mb-1">Ventas</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Bot para vender productos</div>
                </button>
                <button
                  type="button"
                  onClick={() => loadTemplate('restaurante')}
                  className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 border border-orange-100 dark:border-orange-800/30 p-5 rounded-2xl text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:shadow-orange-500/10"
                >
                  <div className="text-3xl mb-2">🍽️</div>
                  <div className="font-bold text-slate-800 dark:text-white mb-1">Restaurante</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Bot para tomar pedidos</div>
                </button>
              </div>
            </div>

            {/* Instancia */}
            <div className="bg-white dark:bg-[#1e293b] border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Selecciona tu instancia de WhatsApp
              </label>
              {instances.length === 0 ? (
                <div className="text-slate-500 dark:text-slate-400 text-sm">
                  No tienes instancias conectadas.{' '}
                  <Link href="/instances" className="text-indigo-500 hover:text-indigo-600 font-medium">
                    Conecta una instancia
                  </Link>
                </div>
              ) : (
                <select
                  value={selectedInstance}
                  onChange={(e) => setSelectedInstance(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
                >
                  {instances.map((instance) => (
                    <option key={instance.documentId} value={instance.documentId}>
                      {instance.name || 'Instancia'} - {instance.phoneNumber || 'Sin número'}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Nombre del Chatbot */}
            <div className="bg-white dark:bg-[#1e293b] border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nombre del Chatbot
              </label>
              <input
                type="text"
                value={chatbotName}
                onChange={(e) => setChatbotName(e.target.value)}
                placeholder="Ej: Bot de Soporte, Asistente Virtual..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white placeholder-slate-400"
              />
            </div>

            {/* Mensaje de Bienvenida */}
            <div className="bg-white dark:bg-[#1e293b] border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Mensaje de Bienvenida (opcional)
              </label>
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                placeholder="Mensaje que se envía cuando alguien escribe por primera vez..."
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white placeholder-slate-400"
              />
            </div>

            {/* Respuesta por Defecto */}
            <div className="bg-white dark:bg-[#1e293b] border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Respuesta por Defecto
              </label>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">
                Mensaje que se envía cuando no se encuentra ninguna regla coincidente
              </p>
              <textarea
                value={defaultResponse}
                onChange={(e) => setDefaultResponse(e.target.value)}
                placeholder="Ej: Lo siento, no entendí tu mensaje. ¿Podrías reformularlo?"
                rows={2}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white placeholder-slate-400"
              />
            </div>
          </>
        )}

        {/* Tab: Reglas */}
        {activeTab === 'rules' && (
          <>
            {/* Agregar Nueva Regla */}
            <div className="bg-white dark:bg-[#1e293b] border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <PlusIcon className="w-5 h-5" />
                Agregar Nueva Regla
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Disparador (palabras clave)
                  </label>
                  <input
                    type="text"
                    value={newTrigger}
                    onChange={(e) => setNewTrigger(e.target.value)}
                    placeholder="Ej: hola|hi|buenos dias (usa | para separar opciones)"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white placeholder-slate-400"
                  />
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 flex items-center gap-1">
                    <SparklesIcon className="w-3 h-3" />
                    Usa | para múltiples opciones. No distingue mayúsculas/minúsculas.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Respuesta
                  </label>
                  <textarea
                    value={newResponse}
                    onChange={(e) => setNewResponse(e.target.value)}
                    placeholder="Mensaje que se enviará cuando se detecte el disparador..."
                    rows={3}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white placeholder-slate-400"
                  />
                </div>

                <button
                  type="button"
                  onClick={addRule}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 px-4 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 transform hover:-translate-y-0.5 font-medium flex items-center justify-center gap-2"
                >
                  <PlusIcon className="w-5 h-5" />
                  Agregar Regla
                </button>
              </div>
            </div>

            {/* Lista de Reglas */}
            <div className="bg-white dark:bg-[#1e293b] border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
                Reglas Configuradas ({rules.length})
              </h3>

              {rules.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <p className="text-slate-500 dark:text-slate-400 mb-2">No hay reglas configuradas aún</p>
                  <p className="text-sm text-slate-400">Agrega tu primera regla arriba</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className={`rounded-2xl p-4 border transition-all duration-300 ${rule.isActive
                        ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border-emerald-200 dark:border-emerald-800/30'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-mono text-sm bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                              {rule.trigger}
                            </span>
                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${rule.isActive
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                              }`}>
                              {rule.isActive ? 'Activa' : 'Inactiva'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{rule.response}</p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            type="button"
                            onClick={() => toggleRule(rule.id)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title={rule.isActive ? 'Pausar' : 'Activar'}
                          >
                            {rule.isActive ? (
                              <PauseIcon className="w-5 h-5 text-blue-500" />
                            ) : (
                              <PlayIcon className="w-5 h-5 text-emerald-500" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeRule(rule.id)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <TrashIcon className="w-5 h-5 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Tab: Vista Previa */}
        {activeTab === 'preview' && (
          <div className="bg-white dark:bg-[#1e293b] border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <EyeIcon className="w-5 h-5" />
              Vista Previa del Chatbot
            </h3>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Nombre</span>
                    <p className="font-semibold text-slate-800 dark:text-white mt-1">{chatbotName || 'Sin nombre'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Reglas Activas</span>
                    <p className="font-semibold text-slate-800 dark:text-white mt-1">
                      {rules.filter(r => r.isActive).length} de {rules.length}
                    </p>
                  </div>
                </div>
              </div>

              {welcomeMessage && (
                <div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    Mensaje de Bienvenida
                  </span>
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-2xl p-4">
                    <p className="text-emerald-700 dark:text-emerald-400">{welcomeMessage}</p>
                  </div>
                </div>
              )}

              <div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  Respuesta por Defecto
                </span>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-4">
                  <p className="text-amber-700 dark:text-amber-400">{defaultResponse || 'No configurada'}</p>
                </div>
              </div>

              {rules.filter(r => r.isActive).length > 0 && (
                <div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">
                    Ejemplos de conversación
                  </span>
                  <div className="space-y-3">
                    {rules.filter(r => r.isActive).slice(0, 3).map((rule) => (
                      <div key={rule.id} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                          Usuario: <span className="text-slate-800 dark:text-white font-medium">{rule.trigger.split('|')[0]}</span>
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Bot: <span className="text-indigo-600 dark:text-indigo-400 font-medium">{rule.response}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push('/templates')}
            className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 px-6 rounded-xl transition-all font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading || instances.length === 0 || !chatbotName.trim() || rules.length === 0}
            className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/25 text-white py-3 px-6 rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-medium flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                Activar Chatbot
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Chatbot() {
  return (
    <Sidebard>
      <ChatbotContent />
    </Sidebard>
  );
}


// Force SSR to avoid static generation errors
export async function getServerSideProps() {
  return { props: {} };
}
