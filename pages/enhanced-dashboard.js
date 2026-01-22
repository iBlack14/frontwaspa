import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { 
  SkeletonLoader, 
  MessageSkeleton, 
  ContactSkeleton, 
  DashboardSkeleton 
} from '../components/ui/SkeletonLoader';
import { 
  ChatBubbleLeftIcon, 
  UserGroupIcon, 
  CogIcon,
  PlusIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';

// Importar componentes que usan hooks de forma dinámica para SSR
const DynamicToastProvider = dynamic(() => import('../components/ui/Toast').then(mod => ({ default: mod.ToastProvider })), { ssr: false });
const DynamicEnhancedDashboardContent = dynamic(() => import('./enhanced-dashboard-content').then(mod => ({ default: mod.default })), { ssr: false });

const EnhancedDashboard = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando dashboard mejorado...</p>
        </div>
      </div>
    );
  }

  return (
    <DynamicToastProvider>
      <DynamicEnhancedDashboardContent />
    </DynamicToastProvider>
  );
};

export default EnhancedDashboard;
