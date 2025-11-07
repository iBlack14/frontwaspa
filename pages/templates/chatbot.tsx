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

interface ChatbotRule {
  id: string;
  trigger: string;
  response: string;
  isActive: boolean;
}

function ChatbotContent() {
  const { data: session, status } = useSession();
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

  const addRule = () => {
    if (!newTrigger.trim() || !newResponse.trim()) {
      toast.error('Completa el disparador y la respuesta');
      return;
    }

    const rule: ChatbotRule = {
      id: Date.now().toString(),
      trigger: newTrigger.trim(),
      response: newResponse.trim(),
      isActive: true,
    };

    setRules([...rules, rule]);
    setNewTrigger('');
    setNewResponse('');
    toast.success('Regla agregada');
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
    toast.info('Regla eliminada');
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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/templates"
                className="text-emerald-500 hover:text-emerald-400 transition"
              >
                ← Volver
              </Link>
              <h1 className="text-2xl font-bold">🤖 Chatbot IA</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-800 bg-zinc-900/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('config')}
              className={`py-4 px-6 border-b-2 transition ${
                activeTab === 'config'
                  ? 'border-emerald-500 text-emerald-500'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              ⚙️ Configuración
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`py-4 px-6 border-b-2 transition ${
                activeTab === 'rules'
                  ? 'border-emerald-500 text-emerald-500'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              📝 Reglas ({rules.length})
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`py-4 px-6 border-b-2 transition ${
                activeTab === 'preview'
                  ? 'border-emerald-500 text-emerald-500'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              👁️ Vista Previa
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Tab: Configuración */}
          {activeTab === 'config' && (
            <>
              {/* Templates Rápidos */}
              <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">⚡ Templates Rápidos</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => loadTemplate('soporte')}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg text-left transition"
                  >
                    <div className="text-2xl mb-1">🛠️</div>
                    <div className="font-semibold">Soporte</div>
                    <div className="text-xs opacity-90">Bot de atención al cliente</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => loadTemplate('ventas')}
                    className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg text-left transition"
                  >
                    <div className="text-2xl mb-1">💰</div>
                    <div className="font-semibold">Ventas</div>
                    <div className="text-xs opacity-90">Bot para vender productos</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => loadTemplate('restaurante')}
                    className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-lg text-left transition"
                  >
                    <div className="text-2xl mb-1">🍽️</div>
                    <div className="font-semibold">Restaurante</div>
                    <div className="text-xs opacity-90">Bot para tomar pedidos</div>
                  </button>
                </div>
              </div>

              {/* Instancia */}
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

              {/* Nombre del Chatbot */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <label className="block text-sm font-medium mb-2">
                  Nombre del Chatbot
                </label>
                <input
                  type="text"
                  value={chatbotName}
                  onChange={(e) => setChatbotName(e.target.value)}
                  placeholder="Ej: Bot de Soporte, Asistente Virtual..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Mensaje de Bienvenida */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <label className="block text-sm font-medium mb-2">
                  Mensaje de Bienvenida (opcional)
                </label>
                <textarea
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Mensaje que se envía cuando alguien escribe por primera vez..."
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Respuesta por Defecto */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <label className="block text-sm font-medium mb-2">
                  Respuesta por Defecto
                </label>
                <p className="text-zinc-400 text-sm mb-2">
                  Mensaje que se envía cuando no se encuentra ninguna regla coincidente
                </p>
                <textarea
                  value={defaultResponse}
                  onChange={(e) => setDefaultResponse(e.target.value)}
                  placeholder="Ej: Lo siento, no entendí tu mensaje. ¿Podrías reformularlo?"
                  rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </>
          )}

          {/* Tab: Reglas */}
          {activeTab === 'rules' && (
            <>
              {/* Agregar Nueva Regla */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">➕ Agregar Nueva Regla</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Disparador (palabras clave)
                    </label>
                    <input
                      type="text"
                      value={newTrigger}
                      onChange={(e) => setNewTrigger(e.target.value)}
                      placeholder="Ej: hola|hi|buenos dias (usa | para separar opciones)"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-zinc-400 text-xs mt-1">
                      💡 Usa | para múltiples opciones. No distingue mayúsculas/minúsculas.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Respuesta
                    </label>
                    <textarea
                      value={newResponse}
                      onChange={(e) => setNewResponse(e.target.value)}
                      placeholder="Mensaje que se enviará cuando se detecte el disparador..."
                      rows={3}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={addRule}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-md transition"
                  >
                    ➕ Agregar Regla
                  </button>
                </div>
              </div>

              {/* Lista de Reglas */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">📋 Reglas Configuradas ({rules.length})</h3>
                
                {rules.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400">
                    <div className="text-4xl mb-2">📝</div>
                    <p>No hay reglas configuradas aún</p>
                    <p className="text-sm">Agrega tu primera regla arriba</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rules.map((rule) => (
                      <div
                        key={rule.id}
                        className={`border rounded-lg p-4 transition ${
                          rule.isActive
                            ? 'border-emerald-600 bg-emerald-900/10'
                            : 'border-zinc-700 bg-zinc-800/50 opacity-50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono bg-zinc-800 px-2 py-1 rounded">
                                {rule.trigger}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                rule.isActive ? 'bg-emerald-600' : 'bg-zinc-600'
                              }`}>
                                {rule.isActive ? 'Activa' : 'Inactiva'}
                              </span>
                            </div>
                            <p className="text-sm text-zinc-300">{rule.response}</p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              type="button"
                              onClick={() => toggleRule(rule.id)}
                              className="text-blue-500 hover:text-blue-400 text-sm"
                            >
                              {rule.isActive ? '⏸️' : '▶️'}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeRule(rule.id)}
                              className="text-red-500 hover:text-red-400 text-sm"
                            >
                              🗑️
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
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">👁️ Vista Previa del Chatbot</h3>
              
              <div className="bg-zinc-800 rounded-lg p-6 space-y-4">
                <div>
                  <span className="text-zinc-400 text-sm">Nombre:</span>
                  <p className="font-semibold">{chatbotName || 'Sin nombre'}</p>
                </div>

                {welcomeMessage && (
                  <div>
                    <span className="text-zinc-400 text-sm">Mensaje de Bienvenida:</span>
                    <p className="text-emerald-400 mt-1">{welcomeMessage}</p>
                  </div>
                )}

                <div>
                  <span className="text-zinc-400 text-sm">Respuesta por Defecto:</span>
                  <p className="text-yellow-400 mt-1">{defaultResponse || 'No configurada'}</p>
                </div>

                <div>
                  <span className="text-zinc-400 text-sm">Reglas Activas:</span>
                  <p className="font-semibold">{rules.filter(r => r.isActive).length} de {rules.length}</p>
                </div>

                {rules.filter(r => r.isActive).length > 0 && (
                  <div className="mt-4">
                    <span className="text-zinc-400 text-sm block mb-2">Ejemplos de conversación:</span>
                    <div className="space-y-2">
                      {rules.filter(r => r.isActive).slice(0, 3).map((rule) => (
                        <div key={rule.id} className="bg-zinc-900 rounded p-3">
                          <p className="text-sm text-zinc-400 mb-1">
                            Usuario: <span className="text-white">{rule.trigger.split('|')[0]}</span>
                          </p>
                          <p className="text-sm text-zinc-400">
                            Bot: <span className="text-emerald-400">{rule.response}</span>
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
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 px-6 rounded-md transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || instances.length === 0 || !chatbotName.trim() || rules.length === 0}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-6 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Guardando...' : '🚀 Activar Chatbot'}
            </button>
          </div>
        </form>
      </div>
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
