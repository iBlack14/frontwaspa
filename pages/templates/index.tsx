import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import axios from 'axios';
import Sidebard from '../components/dashboard/index';
import {
  SparklesIcon,
  RocketLaunchIcon,
  ClockIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';

const templates = [
  {
    id: 'spam-whatsapp',
    name: 'SPAM WhatsApp',
    description: 'Envía mensajes masivos a múltiples contactos desde un Excel',
    icon: PaperAirplaneIcon,
    emoji: '📨',
    color: 'emerald',
    bgColor: 'bg-emerald-50/50 dark:bg-emerald-900/10',
    borderColor: 'border-emerald-100 dark:border-emerald-800/30',
    hoverShadow: 'hover:shadow-emerald-500/5',
    available: true,
  },
  {
    id: 'chatbot',
    name: 'Chatbot IA',
    description: 'Crea un chatbot inteligente con respuestas automáticas personalizadas',
    icon: SparklesIcon,
    emoji: '🤖',
    color: 'blue',
    bgColor: 'bg-blue-50/50 dark:bg-blue-900/10',
    borderColor: 'border-blue-100 dark:border-blue-800/30',
    hoverShadow: 'hover:shadow-blue-500/5',
    available: true,
  },
  {
    id: 'auto-respuesta',
    name: 'Auto-respuesta',
    description: 'Responde automáticamente a mensajes recibidos',
    icon: ChatBubbleLeftRightIcon,
    emoji: '💬',
    color: 'cyan',
    bgColor: 'bg-cyan-50/50 dark:bg-cyan-900/10',
    borderColor: 'border-cyan-100 dark:border-cyan-800/30',
    hoverShadow: 'hover:shadow-cyan-500/5',
    available: false,
  },
  {
    id: 'envio-programado',
    name: 'Envío Programado',
    description: 'Programa mensajes para enviar en fecha/hora específica',
    icon: ClockIcon,
    emoji: '⏰',
    color: 'purple',
    bgColor: 'bg-purple-50/50 dark:bg-purple-900/10',
    borderColor: 'border-purple-100 dark:border-purple-800/30',
    hoverShadow: 'hover:shadow-purple-500/5',
    available: false,
  },
  {
    id: 'recordatorios',
    name: 'Recordatorios',
    description: 'Configura recordatorios periódicos automáticos',
    icon: BellIcon,
    emoji: '🔔',
    color: 'orange',
    bgColor: 'bg-orange-50/50 dark:bg-orange-900/10',
    borderColor: 'border-orange-100 dark:border-orange-800/30',
    hoverShadow: 'hover:shadow-orange-500/5',
    available: false,
  },
  {
    id: 'calentamiento',
    name: 'Calentamiento WhatsApp',
    description: 'Calienta tu cuenta gradualmente para evitar bloqueos y bans',
    icon: SparklesIcon,
    emoji: '🔥',
    color: 'red',
    bgColor: 'bg-red-50/50 dark:bg-red-900/10',
    borderColor: 'border-red-100 dark:border-red-800/30',
    hoverShadow: 'hover:shadow-red-500/5',
    available: true,
  },
];

function TemplatesContent() {
  const { session, status } = useAuth();
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
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-transparent">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-transparent p-6 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
              Plantillas de Automatización
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Selecciona una plantilla y configúrala fácilmente sin necesidad de programar
            </p>
          </div>
          <Link
            href="/templates/manage"
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 transform hover:-translate-y-0.5 font-medium"
          >
            <SparklesIcon className="w-5 h-5" />
            Gestionar Templates
          </Link>
        </div>
      </div>

      {/* Advertencia si no tiene instancias */}
      {!hasInstances && (
        <div className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800/30 rounded-3xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-2xl">
              <RocketLaunchIcon className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-amber-900 dark:text-amber-300 mb-2">
                Necesitas una instancia conectada
              </h3>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                Para usar las plantillas, primero debes crear y conectar una instancia de WhatsApp.
              </p>
              <Link
                href="/instances"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-2.5 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 transform hover:-translate-y-0.5 font-medium"
              >
                <RocketLaunchIcon className="w-5 h-5" />
                Crear Instancia
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {templates.map((template) => {
          const IconComponent = template.icon;
          return (
            <div
              key={template.id}
              className={`
                group relative bg-white dark:bg-[#1e293b] rounded-3xl p-6 border shadow-sm
                transition-all duration-300
                ${template.borderColor}
                ${template.available && hasInstances
                  ? `hover:shadow-xl ${template.hoverShadow} hover:-translate-y-1 cursor-pointer`
                  : 'opacity-60 cursor-not-allowed'
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
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-3 py-1 rounded-full font-medium">
                    Próximamente
                  </span>
                </div>
              )}

              {/* Icon Container */}
              <div className={`mb-4 p-4 ${template.bgColor} rounded-2xl w-fit`}>
                <IconComponent className={`w-8 h-8 text-${template.color}-600 dark:text-${template.color}-400`} />
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                {template.name}
              </h3>

              {/* Description */}
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 leading-relaxed">
                {template.description}
              </p>

              {/* Button */}
              {template.available && (
                <button
                  disabled={!hasInstances}
                  className={`w-full py-2.5 px-4 rounded-xl transition-all duration-300 font-medium ${hasInstances
                    ? `bg-gradient-to-r from-${template.color}-500 to-${template.color}-600 text-white hover:shadow-lg hover:shadow-${template.color}-500/25 transform hover:-translate-y-0.5`
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    }`}
                >
                  {hasInstances ? 'Usar Plantilla' : 'Requiere Instancia'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Section */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-100 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
            <SparklesIcon className="w-6 h-6 text-indigo-500" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
            ¿Cómo funciona?
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800/30">
            <div className="text-4xl mb-3">1️⃣</div>
            <h4 className="font-bold text-slate-800 dark:text-white mb-2">
              Selecciona una plantilla
            </h4>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Elige la automatización que necesitas
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 rounded-2xl p-6 border border-blue-100 dark:border-blue-800/30">
            <div className="text-4xl mb-3">2️⃣</div>
            <h4 className="font-bold text-slate-800 dark:text-white mb-2">
              Configura los datos
            </h4>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              Rellena un formulario simple con tus datos
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-800/30">
            <div className="text-4xl mb-3">3️⃣</div>
            <h4 className="font-bold text-slate-800 dark:text-white mb-2">
              ¡Listo!
            </h4>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              La automatización se ejecuta automáticamente
            </p>
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
