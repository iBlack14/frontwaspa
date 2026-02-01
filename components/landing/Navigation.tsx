'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import BLXKLogo from './BLXKLogo';

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <BLXKLogo variant="compact" />

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            <a 
              href="#features" 
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium rounded-lg hover:bg-zinc-800/50"
            >
              Caracteristicas
            </a>
            <a 
              href="#pricing" 
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium rounded-lg hover:bg-zinc-800/50"
            >
              Precios
            </a>
            <a 
              href="#testimonials" 
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium rounded-lg hover:bg-zinc-800/50"
            >
              Testimonios
            </a>
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => router.push('/login')}
              className="text-zinc-300 hover:text-white transition-colors text-sm font-medium px-4 py-2"
            >
              Iniciar Sesion
            </button>
            <button
              onClick={() => router.push('/login')}
              className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-5 py-2 rounded-lg transition-all font-semibold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
            >
              Comenzar Gratis
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/50 animate-fadeIn">
          <div className="px-4 py-6 space-y-2">
            <a 
              href="#features" 
              className="block px-4 py-3 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors font-medium"
            >
              Caracteristicas
            </a>
            <a 
              href="#pricing" 
              className="block px-4 py-3 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors font-medium"
            >
              Precios
            </a>
            <a 
              href="#testimonials" 
              className="block px-4 py-3 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors font-medium"
            >
              Testimonios
            </a>
            <div className="pt-4 border-t border-zinc-800 space-y-2">
              <button
                onClick={() => router.push('/login')}
                className="w-full text-zinc-300 hover:text-white px-4 py-3 rounded-lg transition-colors font-medium text-left hover:bg-zinc-800/50"
              >
                Iniciar Sesion
              </button>
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-4 py-3 rounded-lg transition-all font-semibold shadow-lg shadow-emerald-500/20"
              >
                Comenzar Gratis
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
