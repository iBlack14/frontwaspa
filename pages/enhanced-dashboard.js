import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { 
  SkeletonLoader, 
  MessageSkeleton, 
  ContactSkeleton, 
  DashboardSkeleton 
} from '../components/ui/SkeletonLoader';

// Importar componentes que usan hooks de forma dinámica para SSR
const DynamicToastProvider = dynamic(() => import('../components/ui/Toast').then(mod => ({ default: mod.ToastProvider })), { ssr: false });
const DynamicAdaptedDashboard = dynamic(() => import('./adapted-dashboard').then(mod => ({ default: mod.default })), { ssr: false });

const EnhancedDashboard = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando dashboard mejorado...</p>
        </div>
      </div>
    );
  }

  return (
    <DynamicToastProvider>
      <DynamicAdaptedDashboard />
    </DynamicToastProvider>
  );
};

export default EnhancedDashboard;
