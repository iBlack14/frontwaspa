import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '../components/ui/Toast';
import '../styles/futuristic.css';
import { 
  ChatBubbleLeftIcon, 
  UserGroupIcon, 
  CogIcon,
  PlusIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
  ChartBarIcon,
  RocketLaunchIcon,
  SparklesIcon,
  FireIcon,
  BoltIcon,
  CubeIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
  CloudIcon,
  CpuChipIcon,
  SignalIcon,
  WifiIcon,
  PhoneIcon,
  QrCodeIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  TrashIcon,
  ClipboardDocumentIcon,
  SignalSlashIcon
} from '@heroicons/react/24/outline';
import { 
  ChatBubbleLeftIcon as ChatBubbleLeftSolid,
  UserGroupIcon as UserGroupSolid,
  CogIcon as CogSolid
} from '@heroicons/react/24/solid';

const AdaptedDashboard = () => {
  const { success, error, warning, info } = useToast();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeCard, setActiveCard] = useState(null);
  const containerRef = useRef(null);
  
  // Datos del dashboard con estilo similar al actual
  const stats = useMemo(() => [
    {
      id: 'messages',
      title: 'Mensajes',
      value: '1,234',
      change: '+23%',
      trend: 'up',
      icon: ChatBubbleLeftSolid,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      hoverBg: 'hover:bg-blue-100'
    },
    {
      id: 'users',
      title: 'Usuarios Activos',
      value: '567',
      change: '+18%',
      trend: 'up',
      icon: UserGroupSolid,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      hoverBg: 'hover:bg-green-100'
    },
    {
      id: 'instances',
      title: 'Instancias',
      value: '12',
      change: '+12%',
      trend: 'up',
      icon: CogSolid,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      hoverBg: 'hover:bg-purple-100'
    },
    {
      id: 'performance',
      title: 'Rendimiento',
      value: '98.5%',
      change: '+5%',
      trend: 'up',
      icon: BoltIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      hoverBg: 'hover:bg-orange-100'
    }
  ], []);

  useEffect(() => {
    setMounted(true);
    // Detectar tema del sistema
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDarkMode);
  }, []);

  // Theme toggle simple sin conflicto
  const SimpleThemeToggle = () => {
    const [isDark, setIsDark] = useState(darkMode);
    
    const toggleTheme = () => {
      const newTheme = !isDark;
      setIsDark(newTheme);
      setDarkMode(newTheme);
      
      if (newTheme) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    return (
      <motion.button
        onClick={toggleTheme}
        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Cambiar tema"
      >
        {isDark ? (
          <SunIcon className="h-5 w-5" />
        ) : (
          <MoonIcon className="h-5 w-5" />
        )}
      </motion.button>
    );
  };

  const handleShowToast = () => {
    success('¡Éxito!', 'Esta es una notificación de éxito con acciones contextuales', {
      actions: [
        { label: 'Deshacer', onClick: () => console.log('Deshacer') },
        { label: 'Ver', onClick: () => console.log('Ver'), primary: true }
      ]
    });
  };

  const handleLoading = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      success('Operación completada', 'La operación se realizó exitosamente');
    }, 2000);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-800 transition-colors duration-200"
    >
      {/* Header con estilo similar al actual */}
      <motion.header 
        className="bg-white dark:bg-zinc-800 shadow-sm border-b border-gray-200 dark:border-zinc-700"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <motion.h1 
                className="text-2xl font-bold text-gray-900 dark:text-white"
                whileHover={{ scale: 1.05 }}
              >
                Connect Blxk
              </motion.h1>
              <span className="text-sm text-gray-500 dark:text-gray-400">Dashboard Mejorado</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Indicadores de estado */}
              <div className="flex items-center space-x-4">
                <motion.div
                  className="flex items-center space-x-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-full"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <SignalIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs text-green-600 dark:text-green-400">Online</span>
                </motion.div>
                
                <motion.div
                  className="flex items-center space-x-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-full"
                  whileHover={{ scale: 1.1 }}
                >
                  <WifiIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs text-blue-600 dark:text-blue-400">Connected</span>
                </motion.div>
              </div>

              <SimpleThemeToggle />
            </div>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Grid de tarjetas con estilo similar al actual */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.id}
                className="relative group"
                onHoverStart={() => setActiveCard(stat.id)}
                onHoverEnd={() => setActiveCard(null)}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {/* Tarjeta principal con estilo actual */}
                <motion.div
                  className={`relative bg-white dark:bg-zinc-800 border ${stat.borderColor} rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 ${stat.hoverBg}`}
                  whileHover={{
                    scale: 1.02,
                    y: -2
                  }}
                >
                  {/* Icono animado */}
                  <motion.div
                    className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center mb-4`}
                    animate={activeCard === stat.id ? {
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    } : {}}
                    transition={{ duration: 2, repeat: activeCard === stat.id ? Infinity : 0 }}
                  >
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </motion.div>
                  
                  {/* Contenido */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</h3>
                    <motion.div 
                      className="text-3xl font-bold text-gray-900 dark:text-white"
                      animate={activeCard === stat.id ? {
                        scale: [1, 1.1, 1]
                      } : {}}
                    >
                      {stat.value}
                    </motion.div>
                    <div className="flex items-center space-x-2">
                      <motion.span
                        className={`text-sm ${stat.color}`}
                        animate={activeCard === stat.id ? {
                          opacity: [1, 0.5, 1]
                        } : {}}
                        transition={{ duration: 1, repeat: activeCard === stat.id ? Infinity : 0 }}
                      >
                        {stat.change}
                      </motion.span>
                      <ArrowTrendingUpIcon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Panel de control central con estilo adaptado */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {/* Panel de acciones rápidas */}
          <motion.div
            className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-6 shadow-sm"
            whileHover={{ scale: 1.02 }}
          >
            <h3 className="text-lg font-semibold mb-6 flex items-center text-gray-900 dark:text-white">
              <RocketLaunchIcon className="w-5 h-5 mr-2 text-blue-600" />
              Acciones Rápidas
            </h3>
            
            <div className="space-y-4">
              {[
                { icon: SparklesIcon, label: 'Optimizar Sistema', color: 'text-purple-600' },
                { icon: ShieldCheckIcon, label: 'Escanear Seguridad', color: 'text-green-600' },
                { icon: CloudIcon, label: 'Sincronizar Nube', color: 'text-blue-600' },
                { icon: CpuChipIcon, label: 'Analizar Rendimiento', color: 'text-orange-600' }
              ].map((action, index) => (
                <motion.button
                  key={action.label}
                  className="w-full flex items-center space-x-3 px-4 py-3 bg-gray-50 dark:bg-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-600 border border-gray-200 dark:border-zinc-600 rounded-xl transition-all duration-300"
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => success('Acción Ejecutada', `${action.label} iniciado correctamente`)}
                >
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                  <span className="text-gray-900 dark:text-white font-medium">{action.label}</span>
                  <motion.div
                    className="w-2 h-2 bg-green-500 rounded-full ml-auto"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                  />
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Panel de análisis en tiempo real */}
          <motion.div
            className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-6 shadow-sm lg:col-span-2"
            whileHover={{ scale: 1.02 }}
          >
            <h3 className="text-lg font-semibold mb-6 flex items-center text-gray-900 dark:text-white">
              <ChartBarIcon className="w-5 h-5 mr-2 text-purple-600" />
              Análisis en Tiempo Real
            </h3>
            
            {/* Gráfico animado */}
            <div className="h-48 flex items-end justify-between space-x-2 mb-6">
              {Array.from({ length: 12 }, (_, i) => (
                <motion.div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg"
                  style={{ height: `${Math.random() * 80 + 20}%` }}
                  animate={{
                    height: [`${Math.random() * 80 + 20}%`, `${Math.random() * 80 + 20}%`]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.1
                  }}
                  whileHover={{ scale: 1.1 }}
                />
              ))}
            </div>
            
            {/* Métricas */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'CPU', value: '45%', color: 'text-blue-600' },
                { label: 'Memoria', value: '67%', color: 'text-purple-600' },
                { label: 'Red', value: '23ms', color: 'text-green-600' }
              ].map((metric) => (
                <motion.div
                  key={metric.label}
                  className="text-center p-3 bg-gray-50 dark:bg-zinc-700 rounded-lg"
                  whileHover={{ scale: 1.1 }}
                >
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
                  <p className={`text-sm ${metric.color}`}>{metric.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Botones de acción principales */}
        <motion.div
          className="flex flex-col sm:flex-row gap-6 justify-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <motion.button
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transition-all duration-300"
            whileHover={{ 
              scale: 1.05, 
              boxShadow: '0 20px 40px rgba(59, 130, 246, 0.4)'
            }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLoading}
            disabled={loading}
          >
            {loading ? (
              <motion.div
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            ) : (
              <>
                <FireIcon className="w-5 h-5" />
                <span>Iniciar Análisis Avanzado</span>
              </>
            )}
          </motion.button>
          
          <motion.button
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transition-all duration-300"
            whileHover={{ 
              scale: 1.05, 
              boxShadow: '0 20px 40px rgba(34, 197, 94, 0.4)'
            }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShowToast}
          >
            <GlobeAltIcon className="w-5 h-5" />
            <span>Generar Reporte Global</span>
          </motion.button>
        </motion.div>

        {/* Sección de instancias con estilo similar al actual */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Instancias de WhatsApp</h3>
              
              {/* Lista de instancias */}
              <div className="space-y-4">
                {[
                  { id: 1, name: 'Instancia Principal', status: 'active', phone: '+1234567890', messages: 1234 },
                  { id: 2, name: 'Instancia Secundaria', status: 'active', phone: '+0987654321', messages: 567 },
                  { id: 3, name: 'Instancia de Prueba', status: 'inactive', phone: '+1122334455', messages: 89 }
                ].map((instance) => (
                  <motion.div
                    key={instance.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-700 rounded-lg border border-gray-200 dark:border-zinc-600"
                    whileHover={{ scale: 1.02, x: 5 }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        instance.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{instance.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{instance.phone}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{instance.messages} msgs</span>
                      <div className="flex space-x-1">
                        <motion.button
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <QrCodeIcon className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <PlayIcon className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <PauseIcon className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <StopIcon className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Botón de agregar instancia */}
              <motion.button
                className="mt-6 w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <PlusIcon className="w-5 h-5" />
                <span>Agregar Nueva Instancia</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Efectos visuales adicionales */}
      <style jsx>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>
    </div>
  );
};

export default AdaptedDashboard;
