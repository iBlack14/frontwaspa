import Image from 'next/image';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/router';
import Link from 'next/link';
import BLXKLogo from '@/components/landing/BLXKLogo';
import { Toaster, toast } from 'sonner';

export default function Register() {
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  const { status } = useAuth();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Error al registrar');
        setIsLoading(false);
        return;
      }

      toast.success('Registro exitoso! Redirigiendo...');
      setTimeout(() => {
        router.push('/login');
      }, 1500);

    } catch (error) {
      toast.error('Error en el servidor');
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Google Sign In Error:', error);
        toast.error(`Error: ${error.message}`);
      }
    } catch (error: any) {
      console.error('Unexpected error during Google Sign In:', error);
      toast.error('Error inesperado. Por favor, intenta nuevamente.');
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/home');
    }
  }, [status]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden px-4">
      <Toaster richColors position="top-right" expand={true} closeButton />
      
      {/* Background Grid */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex justify-center mb-8">
            <BLXKLogo variant="compact" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Crear Cuenta
          </h1>
          <p className="text-lg text-gray-400">
            Únete a BLXK Connect hoy
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-white mb-2">
                Nombre de Usuario
              </label>
              <input
                id="username"
                type="text"
                placeholder="tu_usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/40 hover:bg-white/8 transition-all"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/40 hover:bg-white/8 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-white mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/40 hover:bg-white/8 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-white mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/40 hover:bg-white/8 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms */}
            <p className="text-xs text-gray-500">
              Al crear una cuenta, aceptas nuestros{' '}
              <a href="#" className="text-cyan-400 hover:text-cyan-300">
                Términos de Servicio
              </a>
              {' '}y{' '}
              <a href="#" className="text-cyan-400 hover:text-cyan-300">
                Política de Privacidad
              </a>
            </p>

            {/* Register Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-sm text-gray-500">o</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/15 transition-all flex items-center justify-center gap-3"
          >
            <Image
              src="/img/google.webp"
              alt="Google"
              width={20}
              height={20}
            />
            Continuar con Google
          </button>
        </div>

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            ¿Ya tienes cuenta?{' '}
            <Link
              href="/login"
              className="text-cyan-400 hover:text-cyan-300 font-semibold transition"
            >
              Inicia sesión
            </Link>
          </p>
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
