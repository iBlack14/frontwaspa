import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useMotionValue, useTransform, useSpring, useScroll } from 'framer-motion';
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
  WifiIcon
} from '@heroicons/react/24/outline';
import { 
  ChatBubbleLeftIcon as ChatBubbleLeftSolid,
  UserGroupIcon as UserGroupSolid,
  CogIcon as CogSolid
} from '@heroicons/react/24/solid';

const FuturisticDashboard = () => {
  const { success, error, warning, info } = useToast();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeCard, setActiveCard] = useState(null);
  const containerRef = useRef(null);
  
  // Motion values para efectos 3D
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const scrollY = useScroll();
  
  const rotateX = useTransform(mouseY, [0, 400], [15, -15]);
  const rotateY = useTransform(mouseX, [0, 400], [-15, 15]);
  
  const backgroundY = useTransform(scrollY.scrollY, [0, 1000], [0, -200]);
  const backgroundOpacity = useTransform(scrollY.scrollY, [0, 300], [1, 0.3]);

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Datos del dashboard con animaciones
  const stats = useMemo(() => [
    {
      id: 'messages',
      title: 'Mensajes',
      value: '12.5K',
      change: '+23%',
      trend: 'up',
      icon: ChatBubbleLeftSolid,
      color: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/10 to-cyan-500/10',
      borderColor: 'border-blue-500/20',
      glowColor: 'shadow-blue-500/25',
      particles: Array.from({ length: 20 }, (_, i) => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 2 + 1
      }))
    },
    {
      id: 'users',
      title: 'Usuarios Activos',
      value: '3.2K',
      change: '+18%',
      trend: 'up',
      icon: UserGroupSolid,
      color: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-500/10 to-pink-500/10',
      borderColor: 'border-purple-500/20',
      glowColor: 'shadow-purple-500/25',
      particles: Array.from({ length: 15 }, (_, i) => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 1.5 + 0.5
      }))
    },
    {
      id: 'instances',
      title: 'Instancias',
      value: '48',
      change: '+12%',
      trend: 'up',
      icon: CogSolid,
      color: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-500/10 to-emerald-500/10',
      borderColor: 'border-green-500/20',
      glowColor: 'shadow-green-500/25',
      particles: Array.from({ length: 25 }, (_, i) => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 1,
        speed: Math.random() * 3 + 1
      }))
    },
    {
      id: 'performance',
      title: 'Rendimiento',
      value: '98.5%',
      change: '+5%',
      trend: 'up',
      icon: BoltIcon,
      color: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-500/10 to-red-500/10',
      borderColor: 'border-orange-500/20',
      glowColor: 'shadow-orange-500/25',
      particles: Array.from({ length: 30 }, (_, i) => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 2.5 + 0.5
      }))
    }
  ], []);

  const handleShowToast = () => {
    success('¡Sistema Actualizado!', 'El dashboard ha sido actualizado con las últimas métricas', {
      actions: [
        { label: 'Ver Detalles', onClick: () => console.log('Ver detalles'), primary: true },
        { label: 'Descargar Reporte', onClick: () => console.log('Descargar') }
      ]
    });
  };

  const handleLoading = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      success('Análisis Completado', 'Se han analizado 1,247 interacciones');
    }, 3000);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center overflow-hidden">
        <div className="relative">
          <motion.div
            className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-0 w-20 h-20 border-4 border-purple-500 border-b-transparent rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-2 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen animated-bg text-white overflow-hidden relative"
    >
      {/* Background animado con partículas */}
      <motion.div 
        className="absolute inset-0 overflow-hidden holographic-grid"
        style={{ y: backgroundY }}
      >
        {/* Partículas flotantes */}
        {Array.from({ length: 50 }, (_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
        
        {/* Streams de datos */}
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="data-stream"
            style={{
              top: `${20 + i * 20}%`,
              animationDelay: `${i * 0.5}s`
            }}
          />
        ))}
        
        {/* Gradiente overlay */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"
          style={{ opacity: backgroundOpacity }}
        />
      </motion.div>

      {/* Header 3D */}
      <motion.header 
        className="relative z-20 glass-morphism border-b border-white/10"
        style={{ rotateX, rotateY }}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, type: 'spring' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <motion.div 
              className="flex items-center space-x-4"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center dynamic-glow"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <CubeIcon className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <motion.h1 
                  className="text-2xl font-bold futuristic-text"
                  whileHover={{ scale: 1.1 }}
                >
                  Connect Blxk
                </motion.h1>
                <p className="text-xs text-gray-400">Next Generation Dashboard</p>
              </div>
            </motion.div>
            
            <div className="flex items-center space-x-6">
              {/* Indicadores de estado */}
              <div className="flex items-center space-x-4">
                <motion.div
                  className="flex items-center space-x-2 px-3 py-1 online-indicator px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <SignalIcon className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-green-400">Online</span>
                </motion.div>
                
                <motion.div
                  className="flex items-center space-x-2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full"
                  whileHover={{ scale: 1.1 }}
                >
                  <WifiIcon className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-blue-400">Connected</span>
                </motion.div>
              </div>

              <motion.button
                onClick={() => setDarkMode(!darkMode)}
                className="p-3 rounded-xl glass-morphism hover:bg-white/20 transition-all duration-300"
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
              >
                {darkMode ? (
                  <SunIcon className="w-5 h-5 text-yellow-400" />
                ) : (
                  <MoonIcon className="w-5 h-5 text-blue-400" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tarjetas 3D con efectos holográficos */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12"
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
                {/* Efecto de brillo */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r ${stat.color} rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300`}
                  animate={activeCard === stat.id ? {
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0]
                  } : {}}
                  transition={{ duration: 2, repeat: activeCard === stat.id ? Infinity : 0 }}
                />
                
                {/* Tarjeta principal */}
                <motion.div
                  className={`relative metric-card p-6 hover:bg-white/10 transition-all duration-300 card-3d`}
                  whileHover={{
                    scale: 1.05,
                    rotateY: 5,
                    rotateX: -5,
                    z: 50
                  }}
                  style={{
                    transformStyle: 'preserve-3d',
                    perspective: '1000px'
                  }}
                >
                  {/* Partículas dentro de la tarjeta */}
                  {activeCard === stat.id && stat.particles.map((particle, i) => (
                    <div
                      key={i}
                      className="particle"
                      style={{
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    />
                  ))}
                  
                  {/* Icono animado */}
                  <motion.div
                    className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center mb-4 dynamic-glow`}
                    animate={activeCard === stat.id ? {
                      rotate: [0, 360],
                      scale: [1, 1.1, 1]
                    } : {}}
                    transition={{ duration: 2, repeat: activeCard === stat.id ? Infinity : 0 }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </motion.div>
                  
                  {/* Contenido */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-300">{stat.title}</h3>
                    <motion.div 
                      className="text-3xl font-bold futuristic-text"
                      animate={activeCard === stat.id ? {
                        scale: [1, 1.1, 1]
                      } : {}}
                    >
                      {stat.value}
                    </motion.div>
                    <div className="flex items-center space-x-2">
                      <motion.span
                        className="text-sm text-green-400"
                        animate={activeCard === stat.id ? {
                          opacity: [1, 0.5, 1]
                        } : {}}
                        transition={{ duration: 1, repeat: activeCard === stat.id ? Infinity : 0 }}
                      >
                        {stat.change}
                      </motion.span>
                      <ArrowTrendingUpIcon className="w-4 h-4 text-green-400" />
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Panel de control central con efectos 3D */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {/* Panel de acciones rápidas */}
          <motion.div
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6"
            whileHover={{ rotateY: 5, scale: 1.02 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <RocketLaunchIcon className="w-5 h-5 mr-2 text-blue-400" />
              Acciones Rápidas
            </h3>
            
            <div className="space-y-4">
              {[
                { icon: SparklesIcon, label: 'Optimizar Sistema', color: 'from-purple-500 to-pink-500' },
                { icon: ShieldCheckIcon, label: 'Escanear Seguridad', color: 'from-green-500 to-emerald-500' },
                { icon: CloudIcon, label: 'Sincronizar Nube', color: 'from-blue-500 to-cyan-500' },
                { icon: CpuChipIcon, label: 'Analizar Rendimiento', color: 'from-orange-500 to-red-500' }
              ].map((action, index) => (
                <motion.button
                  key={action.label}
                  className={`w-full flex items-center space-x-3 px-4 py-3 bg-gradient-to-r ${action.color} bg-opacity-10 border border-white/20 rounded-xl hover:bg-opacity-20 transition-all duration-300`}
                  whileHover={{ scale: 1.02, x: 10 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => success('Acción Ejecutada', `${action.label} iniciado correctamente`)}
                >
                  <action.icon className="w-5 h-5 text-white" />
                  <span className="text-white font-medium">{action.label}</span>
                  <motion.div
                    className="w-2 h-2 bg-white rounded-full ml-auto"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                  />
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Panel de análisis en tiempo real */}
          <motion.div
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 lg:col-span-2"
            whileHover={{ rotateY: -5, scale: 1.02 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <ChartBarIcon className="w-5 h-5 mr-2 text-purple-400" />
              Análisis en Tiempo Real
            </h3>
            
            {/* Gráfico animado */}
            <div className="h-48 flex items-end justify-between space-x-2">
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
            <div className="grid grid-cols-3 gap-4 mt-6">
              {[
                { label: 'CPU', value: '45%', color: 'text-blue-400' },
                { label: 'Memoria', value: '67%', color: 'text-purple-400' },
                { label: 'Red', value: '23ms', color: 'text-green-400' }
              ].map((metric) => (
                <motion.div
                  key={metric.label}
                  className="text-center p-3 bg-white/5 rounded-xl"
                  whileHover={{ scale: 1.1 }}
                >
                  <p className="text-2xl font-bold text-white">{metric.value}</p>
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
            className="futuristic-button px-8 py-4 text-white font-semibold rounded-2xl flex items-center justify-center space-x-3"
            whileHover={{ 
              scale: 1.05, 
              rotateY: 10
            }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLoading}
            disabled={loading}
          >
            {loading ? (
              <div className="futuristic-loader">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
              </div>
            ) : (
              <>
                <FireIcon className="w-5 h-5" />
                <span className="futuristic-text">Iniciar Análisis Avanzado</span>
              </>
            )}
          </motion.button>
          
          <motion.button
            className="futuristic-button px-8 py-4 text-white font-semibold rounded-2xl flex items-center justify-center space-x-3"
            style={{
              background: 'linear-gradient(45deg, #10b981, #059669)',
            }}
            whileHover={{ 
              scale: 1.05, 
              rotateY: -10
            }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShowToast}
          >
            <GlobeAltIcon className="w-5 h-5" />
            <span className="futuristic-text">Generar Reporte Global</span>
          </motion.button>
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

export default FuturisticDashboard;
