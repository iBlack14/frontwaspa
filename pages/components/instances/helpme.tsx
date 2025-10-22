'use client';
import Image from 'next/image';

export default function Helpme() {
  return (
    <div className="bg-zinc-900 px-8 hidden xl:block py-9 rounded-lg shadow-lg max-w-3xl mx-auto mt-10">
      <h2 className="text-xl font-bold px-2 text-white mb-4 flex items-center gap-2">
        ¿Cómo escanear el QR de WhatsApp?
      </h2>
      <Image
        src="/logo/helpme.png"
        alt="Logo"
        width={400}
        height={400}
        className="hidden lg:block w-1/2 h-auto mx-auto mt-10"
        style={{ maxWidth: '400px' }}
      />
      <div className="mt-8 max-w-md mx-auto">
        <ol className="space-y-4 text-zinc-200">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 mt-1">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <rect x="4" y="2" width="16" height="20" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
                <circle cx="12" cy="18" r="1" fill="currentColor" />
              </svg>
            </span>
            <span>
              <span className="font-semibold text-emerald-400">Paso 1:</span> Abre WhatsApp en tu teléfono.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 mt-1">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <rect x="4" y="2" width="16" height="20" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
                <circle cx="12" cy="18" r="1" fill="currentColor" />
              </svg>
            </span>
            <span>
              <span className="font-semibold text-emerald-400">Paso 2:</span> Ve a <span className="font-semibold">Ajustes {'>'} Dispositivos vinculados</span>.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 mt-1">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <rect x="4" y="2" width="16" height="20" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
                <circle cx="12" cy="18" r="1" fill="currentColor" />
              </svg>
            </span>
            <span>
              <span className="font-semibold text-emerald-400">Paso 3:</span> Pulsa en <span className="font-semibold">Vincular un dispositivo</span> y escanea el código QR que aparece en la pantalla.
            </span>
          </li>
        </ol>
      </div>
    </div>
  );
}
