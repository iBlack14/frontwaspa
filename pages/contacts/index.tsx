import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { toast, Toaster } from 'sonner';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import ContactSearch from '../../components/contacts/ContactSearch';

export default function ContactsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [instances, setInstances] = useState<any[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchInstances();
    }
  }, [status]);

  useEffect(() => {
    if (selectedInstance) {
      fetchContacts();
      fetchStats();
    }
  }, [selectedInstance]);

  const fetchInstances = async () => {
    try {
      const res = await fetch('/api/instances');
      const data = await res.json();
      if (data.success && data.instances.length > 0) {
        setInstances(data.instances);
        setSelectedInstance(data.instances[0].document_id);
      }
    } catch (error) {
      console.error('Error loading instances:', error);
      toast.error('Error al cargar instancias');
    }
  };

  const fetchContacts = async () => {
    if (!selectedInstance) return;

    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      const response = await fetch(`${backendUrl}/api/contacts/${selectedInstance}`);
      const data = await response.json();

      if (data.success) {
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast.error('Error al cargar contactos');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!selectedInstance) return;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      const response = await fetch(`${backendUrl}/api/contacts/stats/${selectedInstance}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getPhoneNumber = (jid: string) => {
    return jid?.split('@')[0] || '';
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-zinc-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-800 p-6 sm:p-8">
      <Toaster richColors position="top-right" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
            Contactos de WhatsApp
          </h1>
          <p className="text-gray-600 dark:text-zinc-400">
            Gestiona y busca tus contactos sincronizados
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <UserGroupIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">Con chats</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.withChats}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <ChatBubbleLeftRightIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">Sin leer</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.withUnread}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <UserGroupIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">Bloqueados</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.blocked}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg border border-gray-200 dark:border-zinc-700 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FunnelIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Filtros</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Instance selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">
                Instancia
              </label>
              <select
                value={selectedInstance}
                onChange={(e) => setSelectedInstance(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-zinc-600 rounded-xl
                         focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                         bg-white dark:bg-zinc-700 text-gray-900 dark:text-white"
              >
                {instances.map((instance) => (
                  <option key={instance.document_id} value={instance.document_id}>
                    {instance.name || instance.phone_number || instance.document_id}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-2">
                Buscar contacto
              </label>
              {selectedInstance && <ContactSearch instanceId={selectedInstance} />}
            </div>
          </div>
        </div>

        {/* Contacts List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-zinc-400 font-semibold">Cargando contactos...</p>
            </div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-20">
            <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-800 dark:to-zinc-900
                           border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl max-w-md mx-auto">
              <UserGroupIcon className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-zinc-500" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No hay contactos</h3>
              <p className="text-gray-600 dark:text-zinc-400 text-sm">
                Los contactos se sincronizarán automáticamente cuando recibas mensajes
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => router.push(`/chat/${contact.jid}?instance=${selectedInstance}`)}
                className="bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-zinc-700
                         hover:shadow-2xl hover:scale-105 transition-all duration-200 text-left group"
              >
                <div className="flex items-center gap-3">
                  {contact.profile_pic_url ? (
                    <img
                      src={contact.profile_pic_url}
                      alt={contact.name || 'Contact'}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-zinc-700"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500
                                  flex items-center justify-center text-white font-bold text-lg">
                      {(contact.name || contact.push_name || 'U')[0].toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {contact.name || contact.push_name || 'Sin nombre'}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-zinc-400">
                      <PhoneIcon className="w-4 h-4" />
                      <span>{getPhoneNumber(contact.jid)}</span>
                    </div>
                  </div>

                  <ChatBubbleLeftRightIcon className="w-6 h-6 text-gray-400 group-hover:text-emerald-600
                                                     dark:group-hover:text-emerald-400 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
