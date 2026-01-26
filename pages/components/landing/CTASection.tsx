import { useRouter } from 'next/router';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export default function CTASection() {
  const router = useRouter();
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-600 to-teal-600 dark:from-emerald-700 dark:to-teal-700">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          ¿Listo para transformar tu comunicación?
        </h2>
        <p className="text-xl text-emerald-100 mb-8">
          Únete a miles de empresas que ya están usando BLXK Connect para crecer más rápido
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push('/login')}
            className="bg-white text-emerald-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition font-medium text-lg flex items-center justify-center group"
          >
            Comenzar Gratis Ahora
            <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition" />
          </button>
          <a
            href="mailto:sales@blxkstudio.com"
            className="bg-emerald-700 text-white px-8 py-4 rounded-lg hover:bg-emerald-800 transition font-medium text-lg border-2 border-white/20"
          >
            Hablar con Ventas
          </a>
        </div>
        <p className="mt-6 text-emerald-100 text-sm">
          Sin tarjeta de crédito • 14 días gratis • Cancela cuando quieras
        </p>
      </div>
    </section>
  );
}
