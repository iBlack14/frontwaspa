'use client';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { SparklesIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <nav className="fixed top-0 w-full bg-black/50 backdrop-blur-xl z-50 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="p-2 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-lg group-hover:shadow-lg group-hover:shadow-emerald-500/50 transition">
              <SparklesIcon className="h-6 w-6 text-black" />
            </div>
            <span className="text-xl font-bold text-white">BLXK</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-400 hover:text-white transition text-sm font-medium">
              Características
            </a>
            <a href="#pricing" className="text-gray-400 hover:text-white transition text-sm font-medium">
              Precios
            </a>
            <a href="#testimonials" className="text-gray-400 hover:text-white transition text-sm font-medium">
              Testimonios
            </a>
            <button
              onClick={() => router.push('/login')}
              className="bg-white text-black px-6 py-2 rounded-full hover:bg-gray-100 transition font-semibold text-sm"
            >
              Iniciar Sesión
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white"
          >
            {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black/80 backdrop-blur-xl border-t border-white/10">
          <div className="px-4 py-4 space-y-3">
            <a href="#features" className="block text-gray-400 hover:text-white transition">
              Características
            </a>
            <a href="#pricing" className="block text-gray-400 hover:text-white transition">
              Precios
            </a>
            <a href="#testimonials" className="block text-gray-400 hover:text-white transition">
              Testimonios
            </a>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-white text-black px-6 py-2 rounded-full hover:bg-gray-100 transition font-semibold"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
