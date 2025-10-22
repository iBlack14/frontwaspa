'use client';
import Image from 'next/image';
import { EyeIcon, UserIcon } from '@heroicons/react/24/solid';
import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import wazone from '../../../public/logo/wallpaper-wazone.webp';
import fondo from '../../../public/img/fondo.webp';
import fondo_transparent from '../../../public/logo/wazilrest_white.png';
import { useSession } from 'next-auth/react';
import { Toaster, toast } from 'sonner'; // Import Sonner

export default function Home() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      toast.error('Credenciales incorrectas'); // Use Sonner toast for error
    } else {
      toast.success('¡Login exitoso! Redirigiendo...'); // Use Sonner toast for success
      setTimeout(() => {
        router.push('/home');
      }, 1000);
    }
  };

  const handleGoogleSignIn = async () => {
    const result = await signIn('google', { redirect: false });
    if (result?.error) {
      toast.error('Error al iniciar sesión con Google'); // Use Sonner toast for error
    } else {
      toast.success('¡Inicio de sesión con Google exitoso! Redirigiendo...'); // Use Sonner toast for success
      setTimeout(() => {
        router.push('/home');
      }, 1000);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/home');
    }
  }, [status]);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div
      className="min-h-screen bg-slate-950 flex items-center justify-center bg-cover bg-center relative shadow-inner shadow-black"
      style={{
        backgroundImage: `url(${fondo.src})`,
      }}
    >
      <Toaster richColors position="top-right" /> {/* Add Sonner Toaster */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-70"></div>

      <div className="bg-opacity-90 shadow-2xl shadow-black w-full max-w-5xl flex flex-col lg:flex-row">
        <div className="hidden lg:flex lg:w-3/5 w-full items-center justify-center">
          <Image
            src={wazone}
            alt="Background Logo"
            quality={100}
            priority
            className="object-cover h-full w-full lg:rounded-tl-3xl lg:rounded-bl-3xl"
          />
        </div>

        <div className="lg:w-2/5 w-full p-8 backdrop-blur-md bg-slate-100/5 rounded-b-3xl lg:rounded-bl-none lg:rounded-tr-3xl">
          <Image
            src={fondo_transparent}
            alt="Background Logo"
            height={250}
            width={250}
            quality={100}
            priority
            className="mx-auto"
          />
          <h1 className="text-2xl font-bold text-center text-slate-100 mb-2">Login</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xl font-medium text-slate-100">
                Email:
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 w-full px-3 py-2 placeholder-zinc-400 bg-slate-100 text-lg bg-opacity-50 text-slate-600 border border-white border-opacity-30 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-opacity-70"
                  placeholder="alguien@example.com"
                />
                <span className="absolute inset-y-0 right-3 flex items-center">
                  <UserIcon className="h-5 w-5 text-slate-600 opacity-70" />
                </span>
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-xl font-medium text-slate-100">
                Password:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 w-full px-3 py-2 placeholder-zinc-400 bg-slate-100 text-lg bg-opacity-50 text-slate-600 border border-white border-opacity-30 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-opacity-70"
                  placeholder="••••••••"
                />
                <span
                  className="absolute inset-y-0 right-3 flex items-center cursor-pointer"
                  onClick={togglePasswordVisibility}
                >
                  <EyeIcon className="h-5 w-5 text-slate-600 opacity-70" />
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <label className="flex items-center text-sm text-white">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2 h-4 w-4 text-green-500 focus:ring-green-500 border-white border-opacity-30 rounded"
                />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-sm text-white hover:underline">
                Forgot password?
              </Link>
            </div>
            <button
              type="submit"
              className="w-full bg-green-400 hover:bg-green-300 text-white font-bold py-2 rounded-full hover:bg-opacity-90 transition-colors"
            >
              Login
            </button>
          </form>

          <div className="flex items-center justify-center mt-4">
            <div className="w-full h-px bg-white bg-opacity-30"></div>
            <span className="mx-4 text-white text-sm">or</span>
            <div className="w-full h-px bg-white bg-opacity-30"></div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleGoogleSignIn}
              className="mt-4 flex items-center justify-center text-white font-bold py-2 rounded-full transition-colors"
            >
              <div className="p-1 bg-white rounded-full flex items-center justify-center mr-2">
                <Image
                  src="/img/google.webp"
                  alt="Google Logo"
                  width={32}
                  height={32}
                />
              </div>
            </button>
          </div>

            <p className="text-center text-md text-white mt-4">
            ¿No tienes una cuenta?{' '}
            <Link href="/register" className="text-green-400 hover:text-green-300 font-semibold hover:underline">
              Regístrate
            </Link>
            </p>
        </div>
      </div>
    </div>
  );
}