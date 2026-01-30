interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  seoKeywords?: string;
}

const FeatureIcon = ({ type }: { type: 'ai' | 'multi' | 'automation' | 'security' | 'analytics' | 'team' }) => {
  const iconClasses = "w-8 h-8 text-white";
  
  switch(type) {
    case 'ai':
      return (
        <svg className={iconClasses} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
        </svg>
      );
    case 'multi':
      return (
        <svg className={iconClasses} fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
        </svg>
      );
    case 'automation':
      return (
        <svg className={iconClasses} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      );
    case 'security':
      return (
        <svg className={iconClasses} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.72-7 8.77V12H5V6.3l7-3.11v8.8z"/>
        </svg>
      );
    case 'analytics':
      return (
        <svg className={iconClasses} fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/>
        </svg>
      );
    case 'team':
      return (
        <svg className={iconClasses} fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>
      );
    default:
      return null;
  }
};

export default function FeaturesSection() {
  const features: FeatureCardProps[] = [
    {
      icon: <FeatureIcon type="ai" />,
      title: 'IA Conversacional Avanzada',
      description: 'Respuestas automáticas inteligentes impulsadas por GPT-4. Atiende a tus clientes 24/7 sin intervención humana con contexto y precisión.',
      seoKeywords: 'ChatBot IA, Respuestas Automáticas WhatsApp, GPT-4'
    },
    {
      icon: <FeatureIcon type="multi" />,
      title: 'Multi-Instancias Integradas',
      description: 'Gestiona múltiples números de WhatsApp desde una sola plataforma intuitiva. Perfecto para equipos de ventas y soporte distribuidos.',
      seoKeywords: 'Múltiples WhatsApp, Gestión de Números, Plataforma Unificada'
    },
    {
      icon: <FeatureIcon type="automation" />,
      title: 'Automatización N8N Ilimitada',
      description: 'Crea flujos de trabajo personalizados sin código. Integra con +200 aplicaciones: CRM, email, pagos, y mucho más.',
      seoKeywords: 'Automatización Workflows, Integración N8N, No-Code Flows'
    },
    {
      icon: <FeatureIcon type="security" />,
      title: 'Seguridad Empresarial',
      description: 'Encriptación end-to-end, backups automáticos 24/7 y cumplimiento total con GDPR. Tus datos están 100% seguros.',
      seoKeywords: 'Encriptación Datos, GDPR Compliance, Seguridad Empresarial'
    },
    {
      icon: <FeatureIcon type="analytics" />,
      title: 'Analytics & Reporting Avanzado',
      description: 'Métricas en tiempo real, reportes detallados y análisis de sentimiento. Toma decisiones basadas en datos concretos.',
      seoKeywords: 'Analytics WhatsApp, Reportes en Tiempo Real, BI Dashboard'
    },
    {
      icon: <FeatureIcon type="team" />,
      title: 'Colaboración de Equipo',
      description: 'Asigna conversaciones, colabora en tiempo real y gestiona permisos granulares. Escalabilidad para equipos de cualquier tamaño.',
      seoKeywords: 'Trabajo en Equipo, Gestión de Permisos, Colaboración'
    }
  ];

  return (
    <section id="features" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-black overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Todo lo que necesitas para dominar WhatsApp
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Herramientas profesionales diseñadas para escalar tu negocio. Automatiza conversaciones, impulsadas por IA de última generación.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-emerald-500/50 transition-all duration-300"
            >
              {/* Icon Container */}
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6 group-hover:shadow-lg group-hover:shadow-emerald-500/50 transition-all">
                {feature.icon}
              </div>
              
              {/* Content */}
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed mb-4">
                {feature.description}
              </p>
              
              {/* SEO Keywords */}
              {feature.seoKeywords && (
                <div className="pt-4 border-t border-white/5">
                  <p className="text-xs text-gray-500">Palabras clave: {feature.seoKeywords}</p>
                </div>
              )}
              
              {/* Arrow Indicator */}
              <div className="mt-6 inline-flex items-center text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-sm font-medium">Descubre más</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
