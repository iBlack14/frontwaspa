import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  SkeletonLoader, 
  MessageSkeleton, 
  ContactSkeleton, 
  DashboardSkeleton 
} from '../components/ui/SkeletonLoader';
import { useToast } from '../components/ui/Toast';
import { 
  ThemeToggle, 
  Card, 
  Button 
} from '../components/ui/Theme';
import { 
  Modal, 
  Dropdown, 
  Accordion, 
  Tooltip 
} from '../components/ui/Accessibility';
import { 
  InteractiveButton, 
  AnimatedCard, 
  ActionButtons, 
  AnimatedInput, 
  AnimatedSwitch 
} from '../components/ui/MicroInteractions';
import { 
  ChatBubbleLeftIcon, 
  UserGroupIcon, 
  CogIcon,
  PlusIcon,
  BellIcon 
} from '@heroicons/react/24/outline';

const EnhancedDashboard = () => {
  const { success, error, warning, info } = useToast();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

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

  const accordionItems = [
    {
      title: '¿Qué es Connect Blxk?',
      content: 'Connect Blxk es una plataforma completa para gestionar tus instancias de WhatsApp con herramientas avanzadas y una interfaz moderna.'
    },
    {
      title: '¿Cómo funciona el sistema de plantillas?',
      content: 'Nuestro sistema de plantillas te permite automatizar respuestas y flujos de trabajo para optimizar tu comunicación.'
    },
    {
      title: '¿Es seguro mi datos?',
      content: 'Utilizamos encriptación de extremo a extremo y seguimos las mejores prácticas de seguridad para proteger tu información.'
    }
  ];

  const dropdownItems = (
    <>
      <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
        Perfil
      </a>
      <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
        Configuración
      </a>
      <hr className="my-1 border-gray-200 dark:border-gray-700" />
      <a href="#" className="block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
        Cerrar sesión
      </a>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header con mejoras visuales */}
      <motion.header 
        className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700"
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
              <Tooltip content="Notificaciones">
                <motion.button 
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <BellIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </motion.button>
              </Tooltip>
              
              <ThemeToggle />
              
              <Dropdown trigger={
                <motion.button 
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <CogIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </motion.button>
              }>
                {dropdownItems}
              </Dropdown>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Grid de tarjetas animadas */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <AnimatedCard hover tilt>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <ChatBubbleLeftIcon className="h-8 w-8 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">1,234</span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Mensajes</h3>
              <p className="text-xs text-green-600 mt-1">+12% vs mes anterior</p>
            </div>
          </AnimatedCard>

          <AnimatedCard hover tilt>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <UserGroupIcon className="h-8 w-8 text-green-600" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">567</span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Contactos</h3>
              <p className="text-xs text-green-600 mt-1">+8% vs mes anterior</p>
            </div>
          </AnimatedCard>

          <AnimatedCard hover tilt>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <CogIcon className="h-8 w-8 text-purple-600" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">12</span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Instancias</h3>
              <p className="text-xs text-gray-500 mt-1">Todas activas</p>
            </div>
          </AnimatedCard>

          <AnimatedCard hover tilt>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <PlusIcon className="h-8 w-8 text-orange-600" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">89%</span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Tasa de Respuesta</h3>
              <p className="text-xs text-green-600 mt-1">+5% vs mes anterior</p>
            </div>
          </AnimatedCard>
        </motion.div>

        {/* Sección de demostración */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario con inputs animados */}
          <AnimatedCard>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Formulario Mejorado
              </h2>
              
              <div className="space-y-4">
                <AnimatedInput
                  label="Nombre"
                  placeholder="Ingresa tu nombre"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
                
                <AnimatedInput
                  label="Email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  error={formData.email && !formData.email.includes('@') ? 'Email inválido' : ''}
                />
                
                <AnimatedInput
                  label="Mensaje"
                  placeholder="Tu mensaje..."
                  as="textarea"
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                />
                
                <div className="flex items-center justify-between">
                  <AnimatedSwitch
                    checked={darkMode}
                    onChange={setDarkMode}
                    label="Modo oscuro"
                  />
                  
                  <div className="space-x-2">
                    <InteractiveButton
                      variant="secondary"
                      onClick={() => setFormData({ name: '', email: '', message: '' })}
                    >
                      Limpiar
                    </InteractiveButton>
                    
                    <InteractiveButton
                      loading={loading}
                      onClick={handleLoading}
                    >
                      Enviar
                    </InteractiveButton>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedCard>

          {/* Sección de acciones y notificaciones */}
          <AnimatedCard>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Interacciones y Notificaciones
              </h2>
              
              <div className="space-y-6">
                {/* Botones de acción social */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Acciones Sociales
                  </h3>
                  <ActionButtons
                    likes={42}
                    comments={8}
                    shares={3}
                    isLiked={false}
                    isBookmarked={false}
                    onLike={() => success('Like', 'Has dado like')}
                    onComment={() => info('Comentario', 'Abriendo comentarios...')}
                    onShare={() => success('Compartido', 'Contenido compartido')}
                    onBookmark={() => warning('Guardado', 'Contenido guardado en favoritos')}
                  />
                </div>

                {/* Botones de demostración */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Notificaciones Toast
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <InteractiveButton
                      variant="primary"
                      size="sm"
                      onClick={() => success('Éxito', 'Operación completada exitosamente')}
                    >
                      Éxito
                    </InteractiveButton>
                    
                    <InteractiveButton
                      variant="secondary"
                      size="sm"
                      onClick={() => error('Error', 'Ha ocurrido un error')}
                    >
                      Error
                    </InteractiveButton>
                    
                    <InteractiveButton
                      variant="ghost"
                      size="sm"
                      onClick={() => warning('Advertencia', 'Verifica esta información')}
                    >
                      Advertencia
                    </InteractiveButton>
                    
                    <InteractiveButton
                      variant="outline"
                      size="sm"
                      onClick={() => info('Info', 'Información importante')}
                    >
                      Info
                    </InteractiveButton>
                  </div>
                </div>

                {/* Botón para modal */}
                <InteractiveButton
                  variant="primary"
                  onClick={() => setShowModal(true)}
                  className="w-full"
                >
                  Abrir Modal Demo
                </InteractiveButton>
              </div>
            </div>
          </AnimatedCard>
        </div>

        {/* Acordeón */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <AnimatedCard>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Preguntas Frecuentes
              </h2>
              <Accordion items={accordionItems} />
            </div>
          </AnimatedCard>
        </motion.div>

        {/* Sección de Skeleton Loaders */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <AnimatedCard>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Estados de Carga (Skeleton Loaders)
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Cargando Mensajes
                  </h3>
                  <MessageSkeleton />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Cargando Contactos
                  </h3>
                  <ContactSkeleton />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Dashboard en Carga
                  </h3>
                  <DashboardSkeleton />
                </div>
              </div>
            </div>
          </AnimatedCard>
        </motion.div>
      </main>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Modal de Demostración"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Este es un modal accesible con soporte para:
          </p>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
            <li>Focus trap (trampa de foco)</li>
            <li>Navegación por teclado</li>
            <li>Cerrar con tecla Escape</li>
            <li>Animaciones suaves con Framer Motion</li>
            <li>Soporte completo de modo oscuro</li>
          </ul>
          
          <div className="flex justify-end space-x-2 mt-6">
            <InteractiveButton
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </InteractiveButton>
            <InteractiveButton
              variant="primary"
              onClick={() => {
                success('Confirmado', 'Acción confirmada exitosamente');
                setShowModal(false);
              }}
            >
              Confirmar
            </InteractiveButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EnhancedDashboard;
