import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { SparklesIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg z-50 border-b border-gray-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <SparklesIcon className="h-8 w-8 text-emerald-600" />
            <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">BLXK Connect</span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              Características
            </a>
            <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              Precios
            </a>
            <a href="#testimonials" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              Testimonios
            </a>
            <button
              onClick={() => signIn()}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition font-medium"
            >
              Iniciar Sesión
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-600 dark:text-gray-300"
          >
            {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800">
          <div className="px-4 py-4 space-y-3">
            <a href="#features" className="block text-gray-600 dark:text-gray-300 hover:text-emerald-600 transition">
              Características
            </a>
            <a href="#pricing" className="block text-gray-600 dark:text-gray-300 hover:text-emerald-600 transition">
              Precios
            </a>
            <a href="#testimonials" className="block text-gray-600 dark:text-gray-300 hover:text-emerald-600 transition">
              Testimonios
            </a>
            <button
              onClick={() => signIn()}
              className="w-full bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition font-medium"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
