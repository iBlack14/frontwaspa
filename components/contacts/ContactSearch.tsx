import { useState, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon, UserIcon, PhoneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

interface Contact {
  id: string;
  jid: string;
  name?: string;
  push_name?: string;
  profile_pic_url?: string;
  similarity_score?: number;
  last_message_at?: string;
  unread_count?: number;
}

interface ContactSearchProps {
  instanceId: string;
  onContactSelect?: (contact: Contact) => void;
}

export default function ContactSearch({ instanceId, onContactSelect }: ContactSearchProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Debounce search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setContacts([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    const timeoutId = setTimeout(() => {
      searchContacts(searchQuery.trim());
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, instanceId]);

  const searchContacts = async (query: string) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
      const response = await fetch(
        `${backendUrl}/api/contacts/search/${instanceId}?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error('Error searching contacts');
      }

      const data = await response.json();

      if (data.success) {
        setContacts(data.results || []);
        setShowResults(true);
      } else {
        toast.error('Error al buscar contactos');
      }
    } catch (error) {
      console.error('Error searching contacts:', error);
      toast.error('Error al buscar contactos');
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleContactClick = (contact: Contact) => {
    if (onContactSelect) {
      onContactSelect(contact);
    } else {
      // Redirigir a la página de chat
      router.push(`/chat/${contact.jid}?instance=${instanceId}`);
    }
    setShowResults(false);
    setSearchQuery('');
  };

  const getPhoneNumber = (jid: string) => {
    return jid.split('@')[0];
  };

  const getSimilarityColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getSimilarityLabel = (score?: number) => {
    if (!score) return '';
    if (score >= 80) return 'Exacto';
    if (score >= 60) return 'Similar';
    return 'Relacionado';
  };

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar contactos por nombre o número..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery && setShowResults(true)}
          className="w-full px-4 py-3 pl-12 pr-4 border-2 border-gray-300 dark:border-zinc-600 rounded-xl
                   focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                   bg-white dark:bg-zinc-800 text-gray-900 dark:text-white
                   placeholder-gray-500 dark:placeholder-zinc-400
                   transition-all duration-200"
        />
        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />

        {loading && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      {showResults && contacts.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border-2 border-gray-200 dark:border-zinc-700 max-h-96 overflow-y-auto">
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase">
              {contacts.length} resultado{contacts.length !== 1 ? 's' : ''} encontrado{contacts.length !== 1 ? 's' : ''}
            </div>

            {contacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => handleContactClick(contact)}
                className="w-full px-3 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-zinc-700
                         rounded-lg transition-all duration-200 group"
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {contact.profile_pic_url ? (
                    <img
                      src={contact.profile_pic_url}
                      alt={contact.name || 'Contact'}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-zinc-700"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500
                                  flex items-center justify-center text-white font-bold text-lg
                                  ring-2 ring-gray-200 dark:ring-zinc-700">
                      {(contact.name || contact.push_name || 'U')[0].toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {contact.name || contact.push_name || 'Sin nombre'}
                    </h3>
                    {contact.similarity_score && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                                     ${getSimilarityColor(contact.similarity_score)}
                                     bg-gray-100 dark:bg-zinc-700`}>
                        {getSimilarityLabel(contact.similarity_score)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-zinc-400 mt-1">
                    <PhoneIcon className="w-4 h-4" />
                    <span>{getPhoneNumber(contact.jid)}</span>
                  </div>

                  {contact.unread_count && contact.unread_count > 0 && (
                    <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                      <ChatBubbleLeftRightIcon className="w-4 h-4" />
                      <span>{contact.unread_count} mensaje{contact.unread_count !== 1 ? 's' : ''} sin leer</span>
                    </div>
                  )}
                </div>

                {/* Action Icon */}
                <div className="flex-shrink-0">
                  <ChatBubbleLeftRightIcon className="w-6 h-6 text-gray-400 group-hover:text-emerald-600
                                                     dark:group-hover:text-emerald-400 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {showResults && !loading && searchQuery.length >= 2 && contacts.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl
                       border-2 border-gray-200 dark:border-zinc-700 p-6">
          <div className="text-center">
            <UserIcon className="w-12 h-12 mx-auto text-gray-400 dark:text-zinc-500 mb-3" />
            <p className="text-gray-600 dark:text-zinc-400 font-medium">
              No se encontraron contactos
            </p>
            <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1">
              Intenta con otro nombre o número
            </p>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showResults && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
}
