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
        <div className="lg:w-2/5 w-full p-8 backdrop-blur-md bg-slate-100/5 rounded-b-3xl lg:rounded-bl-none lg:rounded-tr-3xl flex flex-col items-center justify-center">
          <Image
            src={fondo_transparent}
            alt="Background Logo"
            height={250}
            width={250}
            quality={100}
            priority
            className="mx-auto"
          />
          <h1 className="text-2xl font-bold text-center text-slate-100 mb-4">
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="text-lg text-center text-slate-100 mb-6">
            Ingresa tu correo electrónico para recibir un enlace de restablecimiento.
          </p>
          <form onSubmit={handleSubmit} className="w-full max-w-xs">
            <input
              type="email"
              placeholder="Tu correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full px-3 py-2 placeholder-zinc-400 bg-slate-100 text-lg bg-opacity-50 text-slate-600 border border-white border-opacity-30 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-opacity-70"
              />

            <button
              type="submit"
              disabled={loading}
              className={`w-full my-5 bg-green-400 hover:bg-green-300 text-white font-bold py-2 rounded-full text-center transition-colors ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Enviando...' : 'Enviar enlace de restablecimiento'}
            </button>
          </form>
          <p className="text-center text-md text-white mt-4">
          ¿Recordaste tu contraseña?{' '}
            <Link href="/login" className="text-green-400 hover:text-green-300 font-semibold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
