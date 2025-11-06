import { signIn } from 'next-auth/react';
import { SparklesIcon, ChatBubbleLeftRightIcon, CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-zinc-900 dark:to-zinc-800">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-6">
            <SparklesIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mr-2" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Plataforma de Comunicación Empresarial
            </span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6">
            Gestiona WhatsApp
            <br />
            <span className="text-emerald-600 dark:text-emerald-400">Como un Profesional</span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Conecta con tus clientes, automatiza respuestas con IA, y escala tu negocio con la plataforma 
            de gestión de WhatsApp más completa del mercado.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => signIn()}
              className="bg-emerald-600 text-white px-8 py-4 rounded-lg hover:bg-emerald-700 transition font-medium text-lg flex items-center justify-center group"
            >
              Comenzar Gratis
              <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition" />
            </button>
            <a
              href="#features"
              className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white px-8 py-4 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition font-medium text-lg border border-gray-300 dark:border-zinc-700"
            >
              Ver Demo
            </a>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-emerald-600 mr-2" />
              Sin tarjeta de crédito
            </div>
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-emerald-600 mr-2" />
              14 días gratis
            </div>
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-emerald-600 mr-2" />
              Cancela cuando quieras
            </div>
          </div>
        </div>

        {/* Hero Image */}
        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-50 dark:from-zinc-900 to-transparent h-32 bottom-0 z-10"></div>
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-700 p-4">
            <div className="aspect-video bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-zinc-700 dark:to-zinc-600 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="h-24 w-24 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300 font-medium">Dashboard Preview</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
