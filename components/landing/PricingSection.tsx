'use client';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import IzipayModal from '../payment/IzipayModal';

export default function PricingSection() {
  const router = useRouter();
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
      router.push('/login');
    } else {
      // Abrir modal de pago para planes de pago
      setSelectedPlan(plan);
      setIsPaymentModalOpen(true);
    }
  };

  return (
    <section id="pricing" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-black overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Planes para cualquier escala
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Comienza gratis, escala cuando crezcas. Cancela cuando quieras, sin contratos forzados.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl transition-all duration-300 ${plan.highlighted
                ? 'md:scale-105 md:z-10'
                : ''
                }`}
            >
              {plan.highlighted && (
                <>
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-6 py-1 rounded-full text-sm font-bold">
                    ⭐ MÁS POPULAR
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-2xl blur-xl"></div>
                </>
              )}

              <div className={`relative bg-gradient-to-br ${
                plan.highlighted
                  ? 'from-white/15 to-white/5 border-2 border-emerald-500/50'
                  : 'from-white/10 to-white/5 border border-white/20'
              } backdrop-blur-sm rounded-2xl p-8 hover:border-emerald-500/50 transition-all`}>
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {plan.name}
                  </h3>
                  <div className={`text-6xl font-bold mb-2 ${plan.highlighted ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400' : 'text-white'}`}>
                    {plan.priceDisplay}
                  </div>
                  <div className="text-gray-400">
                    {plan.period}
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0 text-emerald-400" />
                      <span className="text-gray-300 text-sm">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePlanClick(plan)}
                  className={`w-full py-3 rounded-xl transition font-semibold ${plan.highlighted
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-emerald-500/50'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                    }`}
                >
                  {plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 pt-16 border-t border-white/10">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-emerald-400 mb-2">✓</div>
              <p className="text-white font-semibold mb-1">Sin tarjeta requerida</p>
              <p className="text-gray-400 text-sm">Comienza gratis al instante</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-400 mb-2">✓</div>
              <p className="text-white font-semibold mb-1">Cancela cuando quieras</p>
              <p className="text-gray-400 text-sm">Sin penalizaciones ni contratos</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-400 mb-2">✓</div>
              <p className="text-white font-semibold mb-1">Soporte 24/7 en Español</p>
              <p className="text-gray-400 text-sm">Equipo experto siempre disponible</p>
            </div>
          </div>
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
