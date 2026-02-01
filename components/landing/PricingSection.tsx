'use client';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { CheckIcon, SparklesIcon, RocketLaunchIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';
import IzipayModal from '../payment/IzipayModal';

const plans = [
  {
    name: 'Free',
    price: 0,
    priceDisplay: 'S/0',
    period: 'Por siempre',
    description: 'Perfecto para probar la plataforma',
    features: [
      '1 instancia de WhatsApp',
      '100 mensajes/mes',
      'Respuestas automaticas basicas',
      'Soporte por email',
    ],
    cta: 'Comenzar Gratis',
    highlighted: false,
    icon: SparklesIcon,
  },
  {
    name: 'Pro',
    price: 99,
    priceDisplay: 'S/99',
    period: 'Por mes',
    description: 'Para negocios en crecimiento',
    features: [
      '5 instancias de WhatsApp',
      '10,000 mensajes/mes',
      'IA conversacional con GPT-4',
      'Automatizacion N8N ilimitada',
      'Analytics avanzado',
      'Soporte prioritario 24/7',
    ],
    cta: 'Comenzar con Pro',
    highlighted: true,
    icon: RocketLaunchIcon,
  },
  {
    name: 'Enterprise',
    price: 0,
    priceDisplay: 'Custom',
    period: 'Contactar ventas',
    description: 'Para grandes organizaciones',
    features: [
      'Instancias ilimitadas',
      'Mensajes ilimitados',
      'White Label completo',
      'Infraestructura dedicada',
      'SLA 99.99%',
      'Account Manager dedicado',
    ],
    cta: 'Contactar Ventas',
    highlighted: false,
    icon: BuildingOffice2Icon,
  },
];

export default function PricingSection() {
  const router = useRouter();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);

  const handlePlanClick = (plan: typeof plans[0]) => {
    if (plan.name === 'Enterprise') {
      window.open('mailto:sales@blxkstudio.com');
    } else if (plan.name === 'Free') {
      router.push('/login');
    } else {
      setSelectedPlan(plan);
      setIsPaymentModalOpen(true);
    }
  };

  return (
    <section id="pricing" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-zinc-950">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full mb-6">
            <span className="text-xs font-medium text-zinc-400">Precios simples y transparentes</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Planes para cualquier escala
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Comienza gratis, escala cuando crezcas. Sin contratos forzados.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <div
                key={index}
                className={`relative rounded-2xl transition-all duration-300 ${
                  plan.highlighted ? 'md:-mt-4 md:mb-4' : ''
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="bg-emerald-500 text-zinc-950 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      Popular
                    </span>
                  </div>
                )}

                <div className={`h-full rounded-2xl p-6 lg:p-8 transition-all ${
                  plan.highlighted
                    ? 'bg-zinc-900 border-2 border-emerald-500/50 shadow-xl shadow-emerald-500/10'
                    : 'bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700'
                }`}>
                  {/* Plan Header */}
                  <div className="mb-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                      plan.highlighted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                    <p className="text-sm text-zinc-500">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-bold ${
                        plan.highlighted ? 'text-emerald-400' : 'text-white'
                      }`}>
                        {plan.priceDisplay}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-zinc-500 text-sm">/mes</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-600 mt-1">{plan.period}</p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          plan.highlighted ? 'text-emerald-400' : 'text-zinc-600'
                        }`} />
                        <span className="text-sm text-zinc-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => handlePlanClick(plan)}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                      plan.highlighted
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/20'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust Badges */}
        <div className="mt-16 pt-12 border-t border-zinc-800">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '1', title: 'Sin tarjeta requerida', desc: 'Comienza gratis al instante' },
              { icon: '2', title: 'Cancela cuando quieras', desc: 'Sin penalizaciones ni contratos' },
              { icon: '3', title: 'Soporte en Espanol', desc: 'Equipo experto 24/7' },
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 font-bold text-sm flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                  <p className="text-sm text-zinc-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
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
