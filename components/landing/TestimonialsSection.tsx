export default function TestimonialsSection() {
  const testimonials = [
    {
      name: 'María Castro',
      role: 'CEO, TechStore',
      initials: 'MC',
      text: 'BLXK Connect transformó nuestra atención al cliente. Ahora respondemos 10x más rápido con la IA y nuestros clientes están más satisfechos que nunca.'
    },
    {
      name: 'Carlos Rodríguez',
      role: 'Director de Marketing, Fashion Co',
      initials: 'CR',
      text: 'La automatización con N8N nos ahorró cientos de horas. Ahora podemos enfocarnos en estrategia mientras el sistema maneja las conversaciones rutinarias.'
    },
    {
      name: 'Ana Martínez',
      role: 'Fundadora, Beauty Shop',
      initials: 'AM',
      text: 'Increíble plataforma. Gestiono 3 números de WhatsApp desde un solo lugar. El dashboard de analytics me ayuda a tomar mejores decisiones cada día.'
    }
  ];

  return (
    <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Miles de empresas confían en BLXK Connect para gestionar sus comunicaciones
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-gray-50 dark:bg-zinc-800 rounded-2xl p-8 border border-gray-200 dark:border-zinc-700">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                "{testimonial.text}"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                  {testimonial.initials}
                </div>
                <div className="ml-3">
                  <div className="font-medium text-gray-900 dark:text-white">{testimonial.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
