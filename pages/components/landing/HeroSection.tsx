import { useRouter } from 'next/router';
import {
  SparklesIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ArchiveBoxIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  FaceSmileIcon
} from '@heroicons/react/24/outline';

const MockMessage = ({ own, text, time }: { own?: boolean, text: string, time: string }) => (
  <div className={`flex ${own ? 'justify-end' : 'justify-start'} mb-4`}>
    <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${own
      ? 'bg-emerald-600 text-white rounded-br-sm'
      : 'bg-white dark:bg-zinc-700 text-gray-800 dark:text-gray-200 shadow-sm border border-gray-100 dark:border-zinc-600 rounded-bl-sm'
      }`}>
      <p className="text-sm">{text}</p>
      <p className={`text-[10px] mt-1 ${own ? 'text-emerald-100' : 'text-gray-400'}`}>{time}</p>
    </div>
  </div>
);

const MockChatIem = ({ name, msg, time, active, badge }: { name: string, msg: string, time: string, active?: boolean, badge?: number }) => (
  <div className={`p-3 rounded-xl cursor-pointer transition ${active ? 'bg-emerald-50 dark:bg-zinc-700/50' : 'hover:bg-gray-50 dark:hover:bg-zinc-800'}`}>
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${active ? 'bg-emerald-600' : 'bg-indigo-500'}`}>
        {name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-0.5">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{name}</h4>
          <span className="text-xs text-gray-400">{time}</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{msg}</p>
      </div>
      {badge && (
        <span className="w-5 h-5 bg-emerald-600 rounded-full text-[10px] text-white flex items-center justify-center font-medium">
          {badge}
        </span>
      )}
    </div>
  </div>
);

export default function HeroSection() {
  const router = useRouter();
  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-emerald-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-1/4 w-1/2 h-1/2 bg-blue-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-emerald-100 dark:border-emerald-900/30 rounded-full mb-8 shadow-sm">
            <SparklesIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mr-2" />
            <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              La Suite #1 para WhatsApp Empresarial
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-8 tracking-tight">
            Vende más con <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
              Inteligencia Artificial
            </span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-zinc-400 mb-10 max-w-3xl mx-auto leading-relaxed">
            Centraliza tus conversaciones, activa chatbots inteligentes y potencia tu equipo de ventas
            con una plataforma todo en uno diseñada para escalar.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => router.push('/login')}
              className="bg-emerald-600 text-white px-8 py-4 rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-200/50 dark:shadow-none font-medium text-lg flex items-center group w-full sm:w-auto justify-center"
            >
              Probar Gratis Ahora
              <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition" />
            </button>
            <a
              href="#features"
              className="px-8 py-4 rounded-xl text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition font-medium text-lg border border-gray-200 dark:border-zinc-700 w-full sm:w-auto flex justify-center"
            >
              Cómo funciona
            </a>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium text-gray-500 dark:text-zinc-500">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-emerald-500 mr-2" />
              Setup en 2 minutos
            </div>
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-emerald-500 mr-2" />
              No requiere tarjeta
            </div>
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-emerald-500 mr-2" />
              Soporte 24/7
            </div>
          </div>
        </div>

        {/* Mock Dashboard UI */}
        <div className="relative mx-auto max-w-6xl">
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-50 dark:from-zinc-900 to-transparent z-[-1] -bottom-20"></div>

          <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-zinc-700 ring-1 ring-black/5">
            {/* Window Controls */}
            <div className="h-10 bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              <div className="mx-auto text-xs text-gray-400 font-medium">BLXK Connect Dashboard</div>
            </div>

            <div className="flex h-[600px] overflow-hidden">
              {/* Sidebar */}
              <div className="w-16 sm:w-20 bg-gray-900 flex flex-col items-center py-6 gap-6 z-20">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white mb-4">
                  <SparklesIcon className="w-6 h-6" />
                </div>
                <div className="p-3 bg-gray-800 rounded-xl text-emerald-400 cursor-pointer">
                  <ChatBubbleLeftRightIcon className="w-6 h-6" />
                </div>
                <div className="p-3 text-gray-400 hover:text-white cursor-pointer transition">
                  <UserGroupIcon className="w-6 h-6" />
                </div>
                <div className="p-3 text-gray-400 hover:text-white cursor-pointer transition">
                  <ArchiveBoxIcon className="w-6 h-6" />
                </div>
                <div className="mt-auto p-3 text-gray-400 hover:text-white cursor-pointer transition">
                  <Cog6ToothIcon className="w-6 h-6" />
                </div>
              </div>

              {/* Chat List */}
              <div className="w-80 border-r border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hidden md:flex flex-col">
                <div className="p-4 border-b border-gray-100 dark:border-zinc-800">
                  <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Mensajes</h3>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar chat..."
                      className="w-full bg-gray-100 dark:bg-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 ring-emerald-500/50 transition dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  <MockChatIem name="Carlos Rodríguez" msg="¡Gracias! Ya recibí el pedido." time="10:42" active />
                  <MockChatIem name="Tech Solutions SAC" msg="¿Tienen facturación electrónica?" time="10:30" badge={2} />
                  <MockChatIem name="Ana Martínez" msg="Necesito soporte con mi cuenta" time="Yesterday" />
                  <MockChatIem name="Distribuidora Norte" msg="Confirmando pago..." time="Yesterday" />
                </div>
              </div>

              {/* Chat View */}
              <div className="flex-1 bg-gray-50 dark:bg-zinc-900/50 flex flex-col relative">
                {/* Chat Header */}
                <div className="h-16 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700 flex items-center px-6 justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">C</div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">Carlos Rodríguez</h4>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">Online</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-500 transition">
                      <UserGroupIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 p-6 overflow-hidden relative">
                  <div className="space-y-6">
                    <div className="flex justify-center">
                      <span className="text-xs font-medium text-gray-400 bg-gray-100 dark:bg-zinc-800 px-3 py-1 rounded-full">Hoy</span>
                    </div>
                    <MockMessage text="Hola, quisiera saber si tienen stock del plan Enterprise?" time="10:30 AM" />
                    <MockMessage own text="¡Hola Carlos! 👋 Sí, tenemos disponibilidad inmediata." time="10:31 AM" />
                    <MockMessage own text="¿Te gustaría agendar una demo con nuestro equipo?" time="10:31 AM" />
                    <MockMessage text="Sí por favor, ¿pueden mañana a las 10am?" time="10:35 AM" />

                    {/* Bot typing indicator simulation */}
                    <div className="flex justify-start items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <SparklesIcon className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="bg-white dark:bg-zinc-700 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100 dark:border-zinc-600">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-700">
                  <div className="flex gap-4 items-center">
                    <button className="p-2 text-gray-400 hover:text-emerald-500 transition">
                      <FaceSmileIcon className="w-6 h-6" />
                    </button>
                    <div className="flex-1 bg-gray-100 dark:bg-zinc-800 rounded-xl px-4 py-3 text-sm text-gray-500 dark:text-zinc-400">
                      Escribe un mensaje...
                    </div>
                    <button className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-200/50 dark:shadow-none">
                      <PaperAirplaneIcon className="w-5 h-5 -rotate-45 translate-x-0.5 -translate-y-0.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Panel (Info) - Hidden on smaller screens */}
              <div className="w-72 bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-700 hidden lg:block p-6">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-800 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl">👤</div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Carlos R.</h3>
                  <p className="text-sm text-gray-500">CEO @ Tech Solutions</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/20">
                    <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-2">Deal Status</h4>
                    <p className="font-medium text-emerald-700 dark:text-emerald-300">En Negociación</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Información</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Email</span>
                        <span className="text-gray-900 dark:text-white font-medium">carlos@tech.com</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Whatsapp</span>
                        <span className="text-gray-900 dark:text-white font-medium">+51 999...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
