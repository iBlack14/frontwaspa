'use client';
import Image from 'next/image';
import { EyeIcon, UserIcon } from '@heroicons/react/24/solid';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/router';
import Link from 'next/link';
import wazone from '../public/logo/wallpaper-wazone.webp';
import fondo from '../public/img/fondo.webp';
import fondo_transparent from '../public/logo/wazilrest_white.png';
import { Toaster, toast } from 'sonner';

export default function Register() {
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const router = useRouter();
  const { status } = useAuth();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Basic client-side validation
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    try {
      // Registrar usuario usando nuestra API (sin confirmación de email)
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Error al registrar');
        return;
      }

      toast.success('Registro exitoso! Puedes iniciar sesión ahora.');
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (error) {
      toast.error('Error en el servidor');
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

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/home');
    }
  }, [status]);

  return (
    <div
      className="min-h-screen bg-slate-950 flex items-center justify-center bg-cover bg-center relative shadow-inner shadow-black"
      style={{
        backgroundImage: `url(${fondo.src})`,
      }}
    >
      <Toaster richColors position="top-right" expand={true} closeButton />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-70"></div>

      <div className="bg-opacity-90 shadow-2xl shadow-black w-full max-w-6xl flex flex-col lg:flex-row animate-fadeIn">
        <div className="hidden lg:flex lg:w-3/5 w-full items-center justify-center">
          <Image
            src={wazone}
            alt="Background Logo"
            quality={100}
            priority
            className="object-cover h-full w-full lg:rounded-tl-3xl lg:rounded-bl-3xl"
          />
        </div>

        <div className="lg:w-2/5 w-full p-8 backdrop-blur-xl bg-slate-100/5 rounded-b-3xl lg:rounded-bl-none lg:rounded-tr-3xl border-l border-white/10">
          <Image
            src={fondo_transparent}
            alt="Background Logo"
            height={250}
            width={250}
            quality={100}
            priority
            className="mx-auto"
          />
          <h1 className="text-3xl font-bold text-center text-slate-100 mb-2 tracking-tight">Crear Cuenta</h1>
          <p className="text-center text-slate-300 text-sm mb-4">Regístrate para comenzar</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-lg font-semibold text-slate-100 mb-2">
                Nombre de Usuario
              </label>
              <div className="relative group">
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-4 py-3 placeholder-zinc-400 bg-white/10 text-lg text-slate-100 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent placeholder-opacity-70 backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
                  placeholder="tu_usuario"
                />
                <span className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-slate-300 opacity-60 group-focus-within:text-green-400 group-focus-within:opacity-100 transition-all" />
                </span>
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-lg font-semibold text-slate-100 mb-2">
                Email
              </label>
              <div className="relative group">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 placeholder-zinc-400 bg-white/10 text-lg text-slate-100 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent placeholder-opacity-70 backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
                  placeholder="tu@email.com"
                />
                <span className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-slate-300 opacity-60 group-focus-within:text-green-400 group-focus-within:opacity-100 transition-all" />
                </span>
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-lg font-semibold text-slate-100 mb-2">
                Contraseña
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 placeholder-zinc-400 bg-white/10 text-lg text-slate-100 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent placeholder-opacity-70 backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
                  placeholder="••••••••"
                />
                <span
                  className="absolute inset-y-0 right-4 flex items-center cursor-pointer group"
                  onClick={togglePasswordVisibility}
                >
                  <EyeIcon className="h-5 w-5 text-slate-300 opacity-60 hover:text-green-400 hover:opacity-100 transition-all" />
                </span>
              </div>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-lg font-semibold text-slate-100 mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative group">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 placeholder-zinc-400 bg-white/10 text-lg text-slate-100 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent placeholder-opacity-70 backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
                  placeholder="••••••••"
                />
                <span
                  className="absolute inset-y-0 right-4 flex items-center cursor-pointer group"
                  onClick={toggleConfirmPasswordVisibility}
                >
                  <EyeIcon className="h-5 w-5 text-slate-300 opacity-60 hover:text-green-400 hover:opacity-100 transition-all" />
                </span>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Crear Cuenta
            </button>
          </form>

          <div className="flex items-center justify-center mt-6">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            <span className="mx-4 text-slate-300 text-sm font-medium">o</span>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleGoogleSignIn}
              className="mt-4 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
            >
              <div className="p-1 bg-white rounded-full flex items-center justify-center mr-3">
                <Image
                  src="/img/google.webp"
                  alt="Google Logo"
                  width={24}
                  height={24}
                />
              </div>
              <span>Continuar con Google</span>
            </button>
          </div>

          <p className="text-center text-sm text-slate-300 mt-6">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="text-green-400 hover:text-green-300 font-bold hover:underline transition-colors">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}