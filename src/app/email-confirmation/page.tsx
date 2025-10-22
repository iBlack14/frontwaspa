'use client';
import Image from 'next/image';
import Link from 'next/link';
import wazone from '../../../public/logo/wallpaper-wazone.webp';
import fondo from '../../../public/img/fondo.webp';
import fondo_transparent from '../../../public/logo/wazilrest_white.png';
import { Toaster, toast } from 'sonner'; // Import Sonner

export default function Register() {

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
            ¡Cuenta Validada!
          </h1>
          <p className="text-lg text-center text-slate-100 mb-6">
            Su correo ha sido validado correctamente. Ahora puede acceder al sistema.
          </p>
          <Link
            href="/login"
            className="w-full max-w-xs bg-green-400 hover:bg-green-300 text-white font-bold py-2 rounded-full text-center hover:bg-opacity-90 transition-colors"
          >
            Ir a Login
          </Link>
        </div>
      </div>
    </div>
  );
}