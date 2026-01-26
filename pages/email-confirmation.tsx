'use client';
import Image from 'next/image';
import Link from 'next/link';
import wazone from '../public/logo/wallpaper-wazone.webp';
import fondo from '../public/img/fondo.webp';
import fondo_transparent from '../public/logo/wazilrest_white.png';
import { Toaster } from 'sonner';

export default function EmailConfirmation() {
  return (
    <div
      className="min-h-screen bg-slate-950 flex items-center justify-center bg-cover bg-center relative shadow-inner shadow-black"
      style={{
        backgroundImage: `url(${fondo.src})`,
      }}
    >
      <Toaster richColors position="top-right" expand={true} closeButton />
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
            ¡Cuenta Validada!
          </h1>
          <p className="text-sm text-center text-slate-300 mb-8">
            Su correo ha sido validado correctamente. Ahora puede acceder al sistema.
          </p>
          <Link
            href="/login"
            className="w-full max-w-md bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] text-center"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}