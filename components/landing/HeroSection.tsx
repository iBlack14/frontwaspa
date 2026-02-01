'use client';
import { useRouter } from 'next/router';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ArchiveBoxIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const MockMessage = ({ own, text, time }: { own?: boolean, text: string, time: string }) => (
  <div className={`flex ${own ? 'justify-end' : 'justify-start'} mb-3`}>
    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${own
      ? 'bg-emerald-500 text-white rounded-br-md'
      : 'bg-zinc-800 text-zinc-100 rounded-bl-md'
      }`}>
      <p className="text-sm leading-relaxed">{text}</p>
      <p className={`text-[10px] mt-1 ${own ? 'text-emerald-100' : 'text-zinc-500'}`}>{time}</p>
    </div>
  </div>
);

const MockChatItem = ({ name, msg, time, active, badge }: { name: string, msg: string, time: string, active?: boolean, badge?: number }) => (
  <div className={`p-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'}`}>
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm ${active ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
        {name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-0.5">
          <h4 className="text-sm font-medium text-zinc-100 truncate">{name}</h4>
          <span className="text-[10px] text-zinc-500">{time}</span>
        </div>
        <p className="text-xs text-zinc-500 truncate">{msg}</p>
      </div>
      {badge && (
        <span className="w-5 h-5 bg-emerald-500 rounded-full text-[10px] text-white flex items-center justify-center font-medium">
          {badge}
        </span>
      )}
    </div>
  </div>
);

export default function HeroSection() {
  const router = useRouter();
  
  return (
    <section className="relative min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-zinc-950">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="bg-grid-pattern absolute inset-0 opacity-50"></div>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Hero Content */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Column - Text */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full mb-8">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
              <span className="text-xs font-medium text-zinc-400">
                La Suite #1 para WhatsApp Empresarial
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
              Automatiza ventas.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                Escala tu negocio.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg text-zinc-400 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Centraliza conversaciones, activa chatbots con IA y potencia tu equipo de ventas con una plataforma disenada para escalar.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
              <button
                onClick={() => router.push('/login')}
                className="group bg-white text-zinc-950 px-6 py-3.5 rounded-xl hover:bg-zinc-100 transition-all font-semibold text-base flex items-center justify-center shadow-xl shadow-white/10"
              >
                Comenzar Gratis
                <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="#features"
                className="px-6 py-3.5 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-all font-semibold text-base border border-zinc-800 flex items-center justify-center"
              >
                Ver Caracteristicas
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-sm text-zinc-500">
              <div className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 text-emerald-500 mr-1.5" />
                <span>Setup en 2 min</span>
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 text-emerald-500 mr-1.5" />
                <span>Sin tarjeta</span>
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-4 w-4 text-emerald-500 mr-1.5" />
                <span>Soporte 24/7</span>
              </div>
            </div>
          </div>

          {/* Right Column - Dashboard Preview */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent rounded-3xl blur-2xl -z-10"></div>
            
            <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl shadow-black/50">
              {/* Window Controls */}
              <div className="h-10 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
                <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
                <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
                <div className="mx-auto text-xs text-zinc-600 font-medium">BLXK Connect</div>
              </div>

              <div className="flex h-[480px]">
                {/* Mini Sidebar */}
                <div className="w-14 bg-zinc-950 flex flex-col items-center py-4 gap-3 border-r border-zinc-800">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <SparklesIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="p-2 bg-zinc-800 rounded-lg text-emerald-400">
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                  </div>
                  <div className="p-2 text-zinc-600 hover:text-zinc-400 transition-colors">
                    <UserGroupIcon className="w-4 h-4" />
                  </div>
                  <div className="p-2 text-zinc-600 hover:text-zinc-400 transition-colors">
                    <ArchiveBoxIcon className="w-4 h-4" />
                  </div>
                  <div className="mt-auto p-2 text-zinc-600 hover:text-zinc-400 transition-colors">
                    <Cog6ToothIcon className="w-4 h-4" />
                  </div>
                </div>

                {/* Chat List */}
                <div className="w-64 border-r border-zinc-800 bg-zinc-900 hidden sm:flex flex-col">
                  <div className="p-3 border-b border-zinc-800">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-zinc-600" />
                      <div className="w-full bg-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-500">
                        Buscar chat...
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    <MockChatItem name="Carlos R." msg="Gracias! Ya recibi el pedido." time="10:42" active />
                    <MockChatItem name="Tech SAC" msg="Tienen facturacion?" time="10:30" badge={2} />
                    <MockChatItem name="Ana M." msg="Necesito soporte" time="Ayer" />
                    <MockChatItem name="Distrib Norte" msg="Confirmando pago..." time="Ayer" />
                  </div>
                </div>

                {/* Chat View */}
                <div className="flex-1 bg-zinc-950 flex flex-col">
                  {/* Chat Header */}
                  <div className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-medium text-sm">C</div>
                      <div>
                        <h4 className="font-medium text-zinc-100 text-sm">Carlos Rodriguez</h4>
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                          <span className="text-[10px] text-emerald-400">Online</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 p-4 overflow-hidden">
                    <div className="space-y-1">
                      <div className="flex justify-center mb-4">
                        <span className="text-[10px] text-zinc-600 bg-zinc-900 px-2 py-1 rounded-full">Hoy</span>
                      </div>
                      <MockMessage text="Hola, tienen stock del plan Enterprise?" time="10:30" />
                      <MockMessage own text="Hola Carlos! Si, tenemos disponibilidad." time="10:31" />
                      <MockMessage own text="Te agendo una demo?" time="10:31" />
                      <MockMessage text="Si por favor, manana a las 10am?" time="10:35" />
                      
                      {/* AI typing indicator */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <SparklesIcon className="w-3 h-3 text-emerald-400" />
                        </div>
                        <div className="bg-zinc-800 px-3 py-2 rounded-xl rounded-bl-md">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Input Area */}
                  <div className="p-3 bg-zinc-900 border-t border-zinc-800">
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 bg-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-500">
                        Escribe un mensaje...
                      </div>
                      <button className="p-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-400 transition-colors">
                        <PaperAirplaneIcon className="w-4 h-4 -rotate-45" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 pt-12 border-t border-zinc-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '500+', label: 'Empresas activas' },
              { value: '2M+', label: 'Mensajes enviados' },
              { value: '99.9%', label: 'Uptime garantizado' },
              { value: '24/7', label: 'Soporte dedicado' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-sm text-zinc-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
