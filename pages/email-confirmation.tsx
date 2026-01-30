import Link from 'next/link';
import BLXKLogo from '@/components/landing/BLXKLogo';
import { Toaster } from 'sonner';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

export default function EmailConfirmation() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden px-4">
      <Toaster richColors position="top-right" expand={true} closeButton />
      
      {/* Background Grid */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex justify-center mb-8">
            <BLXKLogo variant="compact" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            ¡Bienvenido!
          </h1>
          <p className="text-lg text-gray-400">
            Tu email ha sido verificado
          </p>
        </div>

        {/* Confirmation Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-6">
          {/* Success Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center animate-pulse">
              <CheckCircleIcon className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Message */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-3">
              Cuenta Verificada
            </h2>
            <p className="text-gray-400 leading-relaxed">
              Tu correo electrónico ha sido validado correctamente. Ya puedes acceder a toda la potencia de BLXK Connect.
            </p>
          </div>

          {/* Features Checklist */}
          <div className="space-y-3 mb-8 pb-8 border-b border-white/10">
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <div className="w-5 h-5 bg-emerald-500/20 border border-emerald-500/50 rounded flex items-center justify-center">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              </div>
              <span>Acceso completo a la plataforma</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <div className="w-5 h-5 bg-emerald-500/20 border border-emerald-500/50 rounded flex items-center justify-center">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              </div>
              <span>Gestor de mensajes y contactos</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <div className="w-5 h-5 bg-emerald-500/20 border border-emerald-500/50 rounded flex items-center justify-center">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              </div>
              <span>Soporte técnico prioritario</span>
            </div>
          </div>

          {/* Login Button */}
          <Link
            href="/login"
            className="block w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/50 transition-all text-center"
          >
            Iniciar Sesión
          </Link>
        </div>

        {/* Footer Links */}
        <div className="mt-8 pt-6 border-t border-white/10 flex justify-center gap-4 text-xs text-gray-500">
          <a href="#" className="hover:text-gray-400 transition">Privacidad</a>
          <span>•</span>
          <a href="#" className="hover:text-gray-400 transition">Términos</a>
          <span>•</span>
          <a href="#" className="hover:text-gray-400 transition">Soporte</a>
        </div>
      </div>
    </div>
  );
}


// Force SSR to avoid static generation errors
export async function getServerSideProps() {
  return { props: {} };
}
