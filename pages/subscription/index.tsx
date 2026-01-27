import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Sidebard from '../../components/dashboard/index';
import { CheckCircleIcon, XCircleIcon, SparklesIcon, StarIcon, ShieldCheckIcon, BoltIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

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
  const { session, status } = useAuth();
  const typedSession = session as any;
  const router = useRouter();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Planes estáticos predefinidos
  const plans: Plan[] = [
    {
      id: 1,
      name: 'Plan Básico',
      description: 'Perfecto para comenzar',
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
      description: 'Para negocios en crecimiento',
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
      description: 'Máxima capacidad y control',
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
    <div className="min-h-screen bg-slate-50 dark:bg-transparent p-6 sm:p-8">


      {/* Header */}
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl mb-4">
          <SparklesIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-3 tracking-tight">
          Suscripción y Planes
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
          Elige el plan perfecto para potenciar tu negocio con WhatsApp. Escala sin límites.
        </p>
      </div>

      {error && (
        <div className="mb-8 max-w-4xl mx-auto p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-2xl flex items-center gap-3">
          <XCircleIcon className="w-6 h-6 text-red-500" />
          <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
        </div>
      )}

      {/* Current Plan Status */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="bg-white dark:bg-[#1e293b] border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <ShieldCheckIcon className="w-6 h-6 text-emerald-500" />
            Estado de tu Suscripción
          </h2>

          {isLoadingProfile ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : userProfile ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Usuario</p>
                <p className="text-lg font-bold text-slate-800 dark:text-white truncate">
                  {userProfile.username}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{userProfile.email}</p>
              </div>

              <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Plan Actual</p>
                <div className="flex items-center gap-2">
                  <StarIcon className="w-5 h-5 text-amber-400" />
                  <p className="text-lg font-bold text-slate-800 dark:text-white capitalize">
                    {userProfile.plan_type}
                  </p>
                </div>
              </div>

              <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Estado</p>
                <div className="flex items-center gap-2">
                  {userProfile.status_plan ? (
                    <div className="flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Activo</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-bold text-red-700 dark:text-red-400">Inactivo</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No se pudo cargar la información del perfil
            </div>
          )}
        </div>
      </div>

      {/* Available Plans */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative p-8 rounded-3xl transition-all duration-300 flex flex-col ${plan.recommended
                ? 'bg-white dark:bg-[#1e293b] border-2 border-indigo-500 shadow-xl shadow-indigo-500/10 transform scale-105 z-10'
                : 'bg-white dark:bg-[#1e293b] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg hover:-translate-y-1'
                }`}
            >
              {/* Recommended Badge */}
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                    <SparklesIcon className="w-3 h-3" />
                    MÁS POPULAR
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{plan.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed px-4">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-extrabold text-slate-800 dark:text-white tracking-tight">${plan.price}</span>
                  <span className="text-slate-400 ml-2 font-medium">/mes</span>
                </div>
              </div>

              {/* Features */}
              <div className="flex-1 mb-8">
                <ul className="space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className={`mt-0.5 p-0.5 rounded-full ${plan.recommended ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                        <CheckCircleIcon className="w-4 h-4" />
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleSelectPlan(plan.id, plan.name)}
                className={`w-full py-4 rounded-xl font-bold transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 ${plan.recommended
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white'
                  }`}
              >
                {plan.recommended ? <BoltIcon className="w-5 h-5" /> : null}
                Seleccionar Plan
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-16 max-w-3xl mx-auto text-center">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-3xl p-8">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">
            ¿Necesitas un plan a medida?
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Si tienes requerimientos especiales o necesitas una integración personalizada, nuestro equipo está listo para ayudarte.
          </p>
          <a
            href="mailto:support@wazilrest.com"
            className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 px-6 py-3 rounded-xl font-bold shadow-sm hover:shadow-md transition-all border border-indigo-100 dark:border-indigo-800/50"
          >
            Contactar Soporte
          </a>
        </div>
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
