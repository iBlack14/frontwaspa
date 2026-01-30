'use client';
import { useRouter } from 'next/router';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export default function CTASection() {
  const router = useRouter();
  return (
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-black overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
          El futuro de la comunicación <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500">comienza ahora</span>
        </h2>
        <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
          Únete a 25,000+ empresas que ya están transformando sus operaciones. Menos trabajo manual, más ventas, mejor servicio al cliente.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
          <button
            onClick={() => router.push('/login')}
            className="group bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-10 py-5 rounded-full hover:shadow-xl hover:shadow-emerald-500/50 transition font-semibold text-lg flex items-center justify-center"
          >
            Comenzar Gratis Ahora
            <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition" />
          </button>
          <a
            href="mailto:sales@blxkstudio.com"
            className="group px-10 py-5 rounded-full hover:bg-white/10 transition font-semibold text-lg border-2 border-white/20 text-white flex items-center justify-center gap-2"
          >
            <span>Agendar Demo</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-6 pt-12 border-t border-white/10">
          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-lg">✓</span>
            <span>Sin tarjeta de crédito</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-lg">✓</span>
            <span>Acceso completo 14 días</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-lg">✓</span>
            <span>Cancela cuando quieras</span>
          </div>
        </div>
      </div>
    </section>
  );
}
