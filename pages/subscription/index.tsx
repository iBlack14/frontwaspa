'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Sidebard from '../components/dashboard/index';
import { CheckCircleIcon, XCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Toaster, toast } from 'sonner';

interface CustomSession {
  id?: string;
  jwt?: string;
  email?: string;
}

interface UserProfile {
  status_plan: boolean;
  plan_type: string;
  email: string;
  username: string;
}

interface Plan {
  id: number;
  name: string;
  description: string;
  price: string;
  features: string[];
  recommended?: boolean;
}

function SubscriptionContent() {
  const { data: session, status } = useSession();
  const typedSession = session as CustomSession | null;
  const router = useRouter();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Planes estáticos predefinidos
  const plans: Plan[] = [
    {
      id: 1,
      name: 'Plan Básico',
      description: 'Perfecto para comenzar con WhatsApp Business',
      price: '29.99',
      features: [
        '1 instancia de WhatsApp',
        'Mensajes ilimitados',
        'Soporte por email',
        'Webhooks básicos',
        'API REST',
      ],
    },
    {
      id: 2,
      name: 'Plan Profesional',
      description: 'Ideal para negocios en crecimiento',
      price: '59.99',
      features: [
        '5 instancias de WhatsApp',
        'Mensajes ilimitados',
        'Soporte prioritario 24/7',
        'Webhooks avanzados',
        'API REST completa',
        'Plantillas personalizadas',
        'Estadísticas detalladas',
      ],
      recommended: true,
    },
    {
      id: 3,
      name: 'Plan Empresarial',
      description: 'Para empresas que necesitan máxima capacidad',
      price: '149.99',
      features: [
        'Instancias ilimitadas',
        'Mensajes ilimitados',
        'Soporte dedicado 24/7',
        'Webhooks personalizados',
        'API REST completa',
        'Plantillas ilimitadas',
        'Estadísticas avanzadas',
        'Integración personalizada',
        'SLA garantizado',
      ],
    },
  ];

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const response = await axios.post('/api/user/get', {
          jwt: typedSession?.jwt,
        });

        setUserProfile({
          status_plan: response.data.status_plan || false,
          plan_type: response.data.plan_type || 'free',
          email: response.data.email || '',
          username: response.data.username || '',
        });
      } catch (error: any) {
        console.error('Error al obtener perfil:', error);
        setError('Error al cargar la información del perfil');
        toast.error('Error al cargar perfil');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if (typedSession?.jwt) {
      fetchUserProfile();
    }
  }, [typedSession]);


  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const handleSelectPlan = (planId: number, planName: string) => {
    toast.success(`Has seleccionado el ${planName}`);
    // Aquí puedes agregar la lógica para procesar la compra
    console.log('Plan seleccionado:', planId);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Toaster richColors />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <SparklesIcon className="w-8 h-8 text-cyan-500" />
          Suscripción y Planes
        </h1>
        <p className="text-gray-600 dark:text-zinc-400">
          Gestiona tu suscripción y elige el plan que mejor se adapte a tus necesidades
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Current Plan Status */}
      <div className="mb-8 p-6 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Estado Actual de tu Plan
        </h2>
        
        {isLoadingProfile ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          </div>
        ) : userProfile ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-zinc-400 mb-1">Usuario</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {userProfile.username}
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-zinc-400 mb-1">Tipo de Plan</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {userProfile.plan_type}
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-zinc-400 mb-1">Estado</p>
              <div className="flex items-center gap-2">
                {userProfile.status_plan ? (
                  <>
                    <CheckCircleIcon className="w-6 h-6 text-green-500" />
                    <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                      Activo
                    </span>
                  </>
                ) : (
                  <>
                    <XCircleIcon className="w-6 h-6 text-red-500" />
                    <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                      Inactivo
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-600 dark:text-zinc-400">No se pudo cargar la información del perfil</p>
        )}
      </div>

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Planes Disponibles
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative p-6 border rounded-lg shadow-lg transition-all duration-300 hover:scale-105 flex flex-col ${
                plan.recommended
                  ? 'border-cyan-500 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 ring-2 ring-cyan-500'
                  : 'border-zinc-700 bg-gradient-to-br from-zinc-900 to-zinc-800 hover:shadow-cyan-600/50'
              }`}
            >
              {/* Recommended Badge */}
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                    ⭐ RECOMENDADO
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-sm text-zinc-400">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-cyan-400">${plan.price}</span>
                  <span className="text-zinc-400 ml-2">/mes</span>
                </div>
              </div>

              {/* Features */}
              <div className="flex-1 mb-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-sm text-zinc-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleSelectPlan(plan.id, plan.name)}
                className={`w-full px-4 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg ${
                  plan.recommended
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 hover:shadow-cyan-500/50'
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-700 hover:to-blue-700 hover:shadow-cyan-600/50'
                }`}
              >
                Seleccionar Plan
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-12 p-6 bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-200 dark:border-cyan-800 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          ¿Necesitas ayuda?
        </h3>
        <p className="text-gray-600 dark:text-zinc-400 mb-4">
          Si tienes alguna pregunta sobre los planes o necesitas asistencia, no dudes en contactarnos.
        </p>
        <a
          href="mailto:support@wazilrest.com"
          className="inline-block bg-cyan-600 text-white px-6 py-2 rounded-lg hover:bg-cyan-700 transition-colors"
        >
          Contactar Soporte
        </a>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Sidebard>
      <SubscriptionContent />
    </Sidebard>
  );
}
