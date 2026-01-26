import { SparklesIcon, ChatBubbleLeftRightIcon, BoltIcon, ShieldCheckIcon, ChartBarIcon, UserGroupIcon } from '@heroicons/react/24/outline';

export default function FeaturesSection() {
  const features = [
    {
      icon: SparklesIcon,
      title: 'IA Conversacional',
      description: 'Respuestas automáticas inteligentes con GPT-4. Atiende a tus clientes 24/7 sin intervención humana.',
      gradient: 'from-emerald-50 to-teal-50 dark:from-zinc-800 dark:to-zinc-700',
      iconBg: 'bg-emerald-600'
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'Multi-Instancias',
      description: 'Gestiona múltiples números de WhatsApp desde una sola plataforma. Perfecto para equipos.',
      gradient: 'from-blue-50 to-indigo-50 dark:from-zinc-800 dark:to-zinc-700',
      iconBg: 'bg-blue-600'
    },
    {
      icon: BoltIcon,
      title: 'Automatización N8N',
      description: 'Crea flujos de trabajo personalizados. Integra con CRM, email, y más de 200 aplicaciones.',
      gradient: 'from-purple-50 to-pink-50 dark:from-zinc-800 dark:to-zinc-700',
      iconBg: 'bg-purple-600'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Seguridad Empresarial',
      description: 'Encriptación end-to-end, backups automáticos y cumplimiento con GDPR. Tus datos están seguros.',
      gradient: 'from-orange-50 to-red-50 dark:from-zinc-800 dark:to-zinc-700',
      iconBg: 'bg-orange-600'
    },
    {
      icon: ChartBarIcon,
      title: 'Analytics Avanzado',
      description: 'Métricas en tiempo real, reportes detallados y análisis de sentimiento para tomar mejores decisiones.',
      gradient: 'from-green-50 to-emerald-50 dark:from-zinc-800 dark:to-zinc-700',
      iconBg: 'bg-green-600'
    },
    {
      icon: UserGroupIcon,
      title: 'Trabajo en Equipo',
      description: 'Asigna conversaciones, colabora en tiempo real y gestiona permisos de tu equipo fácilmente.',
      gradient: 'from-cyan-50 to-blue-50 dark:from-zinc-800 dark:to-zinc-700',
      iconBg: 'bg-cyan-600'
    }
  ];

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Todo lo que necesitas para crecer
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Herramientas profesionales para gestionar tus conversaciones de WhatsApp de manera eficiente
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className={`bg-gradient-to-br ${feature.gradient} p-8 rounded-2xl border border-gray-200 dark:border-zinc-600 hover:shadow-xl transition`}>
              <div className={`${feature.iconBg} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
