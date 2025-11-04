'use client';
import { useState, FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import { Toaster, toast } from 'sonner'; // Import Sonner
import wazone from '../../../public/logo/wallpaper-wazone.webp';
import fondo from '../../../public/img/fondo.webp';
import fondo_transparent from '../../../public/logo/wazilrest_white.png';
import router from 'next/router';

export default function ForgotPassword() {
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/auth/forgot-password`, {
        email,
      });
      toast.success('Revisa tu correo para restablecer tu contraseña.');
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (error) {
      toast.error('Ocurrió un error. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-950 flex items-center justify-center bg-cover bg-center relative shadow-inner shadow-black"
      style={{
        backgroundImage: `url(${fondo.src})`,
      }}
    >
      <Toaster richColors position="top-right" expand={true} closeButton /> {/* Add Sonner Toaster */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-70"></div>

      <div className="bg-opacity-90 shadow-2xl shadow-black w-full max-w-5xl flex flex-col lg:flex-row animate-fadeIn">
        <div className="hidden lg:flex lg:w-3/5 w-full items-center justify-center">
          <Image
            src={wazone}
            alt="Background Logo"
            quality={100}
            priority
            className="object-cover h-full w-full lg:rounded-tl-3xl lg:rounded-bl-3xl"
          />
        </div>
        <div className="lg:w-2/5 w-full p-8 backdrop-blur-xl bg-slate-100/5 rounded-b-3xl lg:rounded-bl-none lg:rounded-tr-3xl border-l border-white/10 flex flex-col items-center justify-center">
          <Image
            src={fondo_transparent}
            alt="Background Logo"
            height={250}
            width={250}
            quality={100}
            priority
            className="mx-auto"
          />
          <h1 className="text-3xl font-bold text-center text-slate-100 mb-2 tracking-tight">
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="text-sm text-center text-slate-300 mb-6">
            Ingresa tu correo electrónico para recibir un enlace de restablecimiento.
          </p>
          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5">
            <div className="relative group">
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 placeholder-zinc-400 bg-white/10 text-lg text-slate-100 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent placeholder-opacity-70 backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-300 mt-6">
            ¿Recordaste tu contraseña?{' '}
            <Link href="/login" className="text-green-400 hover:text-green-300 font-bold hover:underline transition-colors">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
