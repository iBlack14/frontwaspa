'use client';
import BLXKLogo from './BLXKLogo';

export default function Footer() {
  return (
    <footer className="relative bg-black border-t border-white/10 px-4 sm:px-6 lg:px-8">
      {/* Background Grid */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10 py-16">
        <div className="grid md:grid-cols-5 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1">
            <BLXKLogo variant="full" className="mb-4" />
            <p className="text-sm text-gray-400 leading-relaxed">
              La plataforma IA más inteligente para gestionar WhatsApp empresarial en Latinoamérica.
            </p>
            <div className="mt-6 flex gap-3">
              <a href="#" className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-emerald-400 transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-emerald-400 transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-white mb-6">Producto</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#features" className="text-gray-400 hover:text-emerald-400 transition">Características</a></li>
              <li><a href="#pricing" className="text-gray-400 hover:text-emerald-400 transition">Precios</a></li>
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition">Integraciones</a></li>
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition">Documentación</a></li>
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition">API Reference</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-white mb-6">Empresa</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition">Sobre Nosotros</a></li>
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition">Blog & Recursos</a></li>
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition">Carreras</a></li>
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition">Casos de Éxito</a></li>
              <li><a href="mailto:contact@blxk.studio" className="text-gray-400 hover:text-emerald-400 transition">Contacto</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-white mb-6">Recursos</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition">Guías & Tutoriales</a></li>
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition">Webinars</a></li>
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition">Comunidad</a></li>
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition">Status Page</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-white mb-6">Legal</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition">Privacidad</a></li>
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition">Términos de Servicio</a></li>
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition">GDPR Compliance</a></li>
              <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition">Seguridad</a></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10"></div>

        {/* Bottom */}
        <div className="py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            © 2025 BLXK Studio. Todos los derechos reservados. Hecho con ❤️ en Latinoamérica.
          </p>
          <div className="flex gap-6 text-xs text-gray-500">
            <span className="flex items-center gap-1">🔒 Encriptación E2E</span>
            <span className="flex items-center gap-1">✓ GDPR Compliant</span>
            <span className="flex items-center gap-1">⚡ 99.99% Uptime</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
