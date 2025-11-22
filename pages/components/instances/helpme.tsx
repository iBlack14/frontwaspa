'use client';
import Image from 'next/image';
import { SparklesIcon } from '@heroicons/react/24/outline';

export default function Helpme() {
  return (
    <div className="hidden xl:block w-full max-w-sm ml-6">
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm sticky top-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
            <SparklesIcon className="w-5 h-5 text-emerald-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            Vincular WhatsApp
          </h2>
        </div>

        <div className="relative w-full aspect-square mb-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl overflow-hidden flex items-center justify-center">
          <Image
            src="/logo/helpme.png"
            alt="Tutorial"
            width={200}
            height={200}
            className="object-contain"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        </div>

        <ol className="space-y-4">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Abre WhatsApp en tu teléfono
            </p>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Ve a <span className="font-semibold text-slate-800 dark:text-white">Ajustes</span> {'>'} <span className="font-semibold text-slate-800 dark:text-white">Dispositivos vinculados</span>
            </p>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold mt-0.5">3</span>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Toca <span className="font-semibold text-slate-800 dark:text-white">Vincular dispositivo</span> y escanea el código QR
            </p>
          </li>
        </ol>
      </div>
    </div>
  );
}
