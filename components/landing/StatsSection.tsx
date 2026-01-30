export default function StatsSection() {
  const stats = [
    { 
      value: '25K+', 
      label: 'Usuarios Activos',
      description: 'Empresas confían en BLXK',
      icon: '👥'
    },
    { 
      value: '500M+', 
      label: 'Mensajes Procesados',
      description: 'Mensajes automatizados con IA',
      icon: '💬'
    },
    { 
      value: '99.99%', 
      label: 'Uptime Garantizado',
      description: 'Infraestructura Enterprise',
      icon: '⚡'
    },
    { 
      value: '45min', 
      label: 'Tiempo Promedio Respuesta',
      description: 'Soporte 24/7 en Español',
      icon: '🚀'
    }
  ];

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-black overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Números que hablan por sí solos
          </h2>
          <p className="text-lg text-gray-400">
            Confía en la plataforma elegida por miles de empresas en Latinoamérica
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-emerald-500/50 hover:bg-white/15 transition-all duration-300"
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{stat.icon}</div>
              <div className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
                {stat.value}
              </div>
              <div className="text-white font-semibold text-lg mb-1">{stat.label}</div>
              <div className="text-sm text-gray-400">{stat.description}</div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="my-16 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

        {/* Trust Badges */}
        <div className="text-center">
          <p className="text-gray-400 mb-6">Certificaciones y Compliance</p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300">✓ GDPR Compliant</div>
            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300">✓ ISO 27001</div>
            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300">✓ SOC 2 Type II</div>
            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300">✓ Encriptación E2E</div>
          </div>
        </div>
      </div>
    </section>
  );
}
