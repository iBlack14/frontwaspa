export default function TestimonialsSection() {
  const testimonials = [
    {
      name: 'María Castro',
      role: 'CEO, TechStore',
      company: 'Ecommerce de Electrónica',
      initials: 'MC',
      avatar: '👩‍💼',
      text: 'BLXK Connect transformó completamente nuestra atención al cliente. Ahora respondemos 10x más rápido con la IA conversacional y nuestros clientes tienen un NPS de 85.',
      metric: '+300% en conversiones'
    },
    {
      name: 'Carlos Rodríguez',
      role: 'Director de Marketing',
      company: 'Fashion Co Latam',
      initials: 'CR',
      avatar: '👨‍💼',
      text: 'La automatización con N8N nos ahorró literalmente cientos de horas mensuales. Ahora nuestro equipo se enfoca en estrategia mientras BLXK maneja las conversaciones rutinarias.',
      metric: '500+ horas ahorradas/mes'
    },
    {
      name: 'Ana Martínez',
      role: 'Fundadora',
      company: 'Beauty Shop Premium',
      initials: 'AM',
      avatar: '👩‍🔬',
      text: 'Plataforma increíble. Gestiono 3 números de WhatsApp desde un solo lugar, con métricas en tiempo real y análisis que me ayudan a tomar decisiones basadas en datos.',
      metric: '+250% en tickets resueltos'
    }
  ];

  return (
    <section id="testimonials" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-black overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Casos de éxito de nuestros clientes
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Miles de empresas en Latinoamérica ya están transformando sus operaciones con BLXK Connect
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-emerald-500/50 hover:bg-white/15 transition-all duration-300">
              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-300 leading-relaxed mb-6 italic">
                "{testimonial.text}"
              </p>

              {/* Metric Badge */}
              <div className="inline-block px-3 py-1 bg-emerald-500/20 border border-emerald-500/50 rounded-full text-sm text-emerald-300 font-semibold mb-6">
                {testimonial.metric}
              </div>

              {/* Author */}
              <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                <div className="text-3xl">{testimonial.avatar}</div>
                <div>
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-sm text-gray-400">{testimonial.role}</div>
                  <div className="text-xs text-gray-500">{testimonial.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Social Proof Stats */}
        <div className="grid md:grid-cols-4 gap-4 pt-12 border-t border-white/10">
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-400">⭐ 4.9</div>
            <p className="text-gray-400 text-sm mt-2">Rating en G2</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-400">🏆 25K+</div>
            <p className="text-gray-400 text-sm mt-2">Usuarios Activos</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-400">🚀 98%</div>
            <p className="text-gray-400 text-sm mt-2">Tasa de Satisfacción</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-400">🌎 15</div>
            <p className="text-gray-400 text-sm mt-2">Países Latinoamérica</p>
          </div>
        </div>
      </div>
    </section>
  );
}
