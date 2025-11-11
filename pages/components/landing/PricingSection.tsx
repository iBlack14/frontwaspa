import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import IzipayModal from '../../../components/payment/IzipayModal';

export default function PricingSection() {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const plans = [
    {
      name: 'Free',
      price: 0,
      priceDisplay: 'S/0',
      period: 'Por siempre',
      features: ['1 instancia de WhatsApp', '100 mensajes/mes', 'Respuestas automáticas básicas', 'Soporte por email'],
      cta: 'Comenzar Gratis',
      highlighted: false
    },
    {
      name: 'Pro',
      price: 99,
      priceDisplay: 'S/99',
      period: 'Por mes',
      features: ['5 instancias de WhatsApp', '10,000 mensajes/mes', 'IA conversacional con GPT-4', 'Automatización N8N ilimitada', 'Analytics avanzado', 'Soporte prioritario 24/7'],
      cta: 'Pagar Ahora',
      highlighted: true
    },
    {
      name: 'Enterprise',
      price: 0,
      priceDisplay: 'Custom',
      period: 'Contactar ventas',
      features: ['Instancias ilimitadas', 'Mensajes ilimitados', 'White Label completo', 'Infraestructura dedicada', 'SLA 99.99%', 'Account Manager dedicado'],
      cta: 'Contactar Ventas',
      highlighted: false
    }
  ];

  const handlePlanClick = (plan: any) => {
    if (plan.name === 'Enterprise') {
      window.open('mailto:sales@blxkstudio.com');
    } else if (plan.name === 'Free') {
      signIn();
    } else {
      // Abrir modal de pago para planes de pago
      setSelectedPlan(plan);
      setIsPaymentModalOpen(true);
    }
  };

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-zinc-800">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Planes para cada necesidad
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Comienza gratis y escala según creces. Sin sorpresas, sin costos ocultos.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`bg-white dark:bg-zinc-900 rounded-2xl p-8 border-2 transition ${
                plan.highlighted
                  ? 'border-emerald-500 transform md:scale-105 shadow-2xl bg-gradient-to-br from-emerald-600 to-teal-600'
                  : 'border-gray-200 dark:border-zinc-700 hover:border-emerald-500'
              } ${plan.highlighted ? 'relative' : ''}`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold">
                  MÁS POPULAR
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                  {plan.name}
                </h3>
                <div className={`text-4xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                  {plan.priceDisplay}
                </div>
                <div className={plan.highlighted ? 'text-emerald-100' : 'text-gray-600 dark:text-gray-400'}>
                  {plan.period}
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircleIcon className={`h-5 w-5 mr-2 mt-0.5 flex-shrink-0 ${plan.highlighted ? 'text-white' : 'text-emerald-600'}`} />
                    <span className={plan.highlighted ? 'text-white' : 'text-gray-600 dark:text-gray-300'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handlePlanClick(plan)}
                className={`w-full py-3 rounded-lg transition font-medium ${
                  plan.highlighted
                    ? 'bg-white text-emerald-600 hover:bg-gray-100'
                    : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de pago */}
      {selectedPlan && (
        <IzipayModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          plan={selectedPlan}
        />
      )}
    </section>
  );
}
