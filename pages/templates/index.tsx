import { SessionProvider, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import Sidebard from '../components/dashboard/index';

const templates = [
  {
    id: 'spam-whatsapp',
    name: 'SPAM WhatsApp',
    description: 'Envía mensajes masivos a múltiples contactos desde un Excel',
    icon: '📨',
    color: 'emerald',
    available: true,
  },
  {
    id: 'auto-respuesta',
    name: 'Auto-respuesta',
    description: 'Responde automáticamente a mensajes recibidos',
    icon: '🤖',
    color: 'blue',
    available: false,
  },
  {
    id: 'envio-programado',
    name: 'Envío Programado',
    description: 'Programa mensajes para enviar en fecha/hora específica',
    icon: '⏰',
    color: 'purple',
    available: false,
  },
  {
    id: 'recordatorios',
    name: 'Recordatorios',
    description: 'Configura recordatorios periódicos automáticos',
    icon: '🔔',
    color: 'orange',
    available: false,
  },
];

function TemplatesContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hasInstances, setHasInstances] = useState(false);
  const [isCheckingInstances, setIsCheckingInstances] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      checkInstances();
    }
  }, [status, router]);

  const checkInstances = async () => {
    try {
      const res = await axios.get('/api/instances');
      const connectedInstances = res.data.instances.filter(
        (i: any) => i.state === 'Connected'
      );
      setHasInstances(connectedInstances.length > 0);
    } catch (error) {
      console.error('Error checking instances:', error);
      setHasInstances(false);
    } finally {
      setIsCheckingInstances(false);
    }
  };

  if (status === 'loading' || isCheckingInstances) {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-emerald-500 hover:text-emerald-400 transition">
                ← Volver
              </Link>
              <h1 className="text-2xl font-bold">Plantillas de Automatización</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-zinc-400">{session?.user?.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Automatiza tu WhatsApp</h2>
          <p className="text-zinc-400">
            Selecciona una plantilla y configúrala fácilmente sin necesidad de programar
          </p>
        </div>

        {/* Advertencia si no tiene instancias */}
        {!hasInstances && (
          <div className="mb-8 bg-yellow-900/20 border border-yellow-600 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">⚠️</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-yellow-500 mb-2">
                  Necesitas una instancia conectada
                </h3>
                <p className="text-zinc-300 mb-4">
                  Para usar las plantillas, primero debes crear y conectar una instancia de WhatsApp.
                </p>
                <Link
                  href="/instances"
                  className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-6 rounded-md transition"
                >
                  Crear Instancia
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`
                relative bg-zinc-900 border border-zinc-800 rounded-lg p-6
                transition-all duration-200
                ${template.available && hasInstances
                  ? 'hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20 cursor-pointer' 
                  : 'opacity-50 cursor-not-allowed'
                }
              `}
              onClick={() => {
                if (template.available && hasInstances) {
                  router.push(`/templates/${template.id}`);
                }
              }}
            >
              {/* Badge "Próximamente" */}
              {!template.available && (
                <div className="absolute top-4 right-4">
                  <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded-full">
                    Próximamente
                  </span>
                </div>
              )}

              {/* Icon */}
              <div className="text-5xl mb-4">{template.icon}</div>

              {/* Title */}
              <h3 className="text-xl font-bold mb-2">{template.name}</h3>

              {/* Description */}
              <p className="text-zinc-400 text-sm mb-4">{template.description}</p>

              {/* Button */}
              {template.available && (
                <button 
                  disabled={!hasInstances}
                  className={`w-full py-2 px-4 rounded-md transition ${
                    hasInstances
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                  }`}
                >
                  {hasInstances ? 'Usar Plantilla' : 'Requiere Instancia'}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">💡 ¿Cómo funciona?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl mb-2">1️⃣</div>
              <h4 className="font-semibold mb-1">Selecciona una plantilla</h4>
              <p className="text-zinc-400 text-sm">
                Elige la automatización que necesitas
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">2️⃣</div>
              <h4 className="font-semibold mb-1">Configura los datos</h4>
              <p className="text-zinc-400 text-sm">
                Rellena un formulario simple con tus datos
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">3️⃣</div>
              <h4 className="font-semibold mb-1">¡Listo!</h4>
              <p className="text-zinc-400 text-sm">
                La automatización se ejecuta automáticamente
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Templates() {
  return (
    <Sidebard>
      <TemplatesContent />
    </Sidebard>
  );
}
