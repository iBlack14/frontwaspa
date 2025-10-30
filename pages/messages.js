import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { io } from 'socket.io-client';

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState([]);
  const [instances, setInstances] = useState([]);
  const [selectedInstance, setSelectedInstance] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const messagesPerPage = 20;

  // Cargar instancias del usuario
  useEffect(() => {
    if (status === 'authenticated') {
      fetchInstances();
      fetchMessages();
      setupWebSocket();
    }
  }, [status]);

  const fetchInstances = async () => {
    try {
      const res = await fetch('/api/instances');
      const data = await res.json();
      if (data.success) {
        setInstances(data.instances || []);
      }
    } catch (error) {
      console.error('Error al cargar instancias:', error);
      toast.error('Error al cargar instancias');
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/messages/all');
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
      toast.error('Error al cargar mensajes');
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = () => {
    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000');
    
    socket.on('new_message', (message) => {
      setMessages(prev => [message, ...prev]);
      toast.success(`Nuevo mensaje de ${message.sender}`);
    });

    return () => socket.disconnect();
  };

  // Filtrar mensajes
  const filteredMessages = messages.filter(msg => {
    const matchesInstance = selectedInstance === 'all' || msg.instanceId === selectedInstance;
    const matchesSearch = 
      msg.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.sender?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesInstance && matchesSearch;
  });

  // Paginación
  const indexOfLastMessage = currentPage * messagesPerPage;
  const indexOfFirstMessage = indexOfLastMessage - messagesPerPage;
  const currentMessages = filteredMessages.slice(indexOfFirstMessage, indexOfLastMessage);
  const totalPages = Math.ceil(filteredMessages.length / messagesPerPage);

  if (status === 'loading') {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  if (status === 'unauthenticated') {
    return <div className="flex items-center justify-center h-screen">Acceso denegado</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Mensajes Recibidos</h1>
          <p className="text-gray-600 mt-2">
            Total: {filteredMessages.length} mensajes
            {selectedInstance !== 'all' && ' (filtrados)'}
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtro por instancia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por instancia
              </label>
              <select
                value={selectedInstance}
                onChange={(e) => {
                  setSelectedInstance(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas las instancias ({instances.length})</option>
                {instances.map((instance) => (
                  <option key={instance.document_id} value={instance.document_id}>
                    {instance.name || instance.phone_number || instance.document_id}
                  </option>
                ))}
              </select>
            </div>

            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar mensajes
              </label>
              <input
                type="text"
                placeholder="Buscar por remitente o texto..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Lista de mensajes */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : currentMessages.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500">No hay mensajes para mostrar</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {currentMessages.map((message, index) => (
                <MessageCard key={`${message.id}-${index}`} message={message} instances={instances} />
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-gray-700">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Componente para cada tarjeta de mensaje
function MessageCard({ message, instances }) {
  const instance = instances.find(i => i.document_id === message.instanceId);
  const instanceName = instance?.name || instance?.phone_number || 'Desconocida';
  
  // Colores aleatorios basados en el instanceId para diferenciar visualmente
  const getInstanceColor = (id) => {
    const colors = [
      'bg-blue-100 border-blue-300',
      'bg-green-100 border-green-300',
      'bg-purple-100 border-purple-300',
      'bg-yellow-100 border-yellow-300',
      'bg-pink-100 border-pink-300',
      'bg-indigo-100 border-indigo-300',
    ];
    const hash = id?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    return colors[hash % colors.length];
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 p-4 ${getInstanceColor(message.instanceId)}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Header del mensaje */}
          <div className="flex items-center space-x-3 mb-2">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
              {message.sender?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{message.sender || 'Desconocido'}</h3>
              <p className="text-sm text-gray-500">
                {new Date(message.timestamp).toLocaleString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          {/* Contenido del mensaje */}
          <div className="ml-13 mb-2">
            <p className="text-gray-800">{message.text || '[Mensaje multimedia]'}</p>
          </div>

          {/* Info de la instancia */}
          <div className="ml-13">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              📱 Instancia: {instanceName}
            </span>
            {message.chatId && (
              <span className="ml-2 text-xs text-gray-500">
                Chat: {message.chatId.split('@')[0]}
              </span>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex-shrink-0 ml-4">
          <button
            onClick={() => window.location.href = `/chat/${message.chatId}?instance=${message.instanceId}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ver Chat
          </button>
        </div>
      </div>
    </div>
  );
}
