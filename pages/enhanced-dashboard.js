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
const DynamicFuturisticDashboard = dynamic(() => import('./futuristic-dashboard').then(mod => ({ default: mod.default })), { ssr: false });

const EnhancedDashboard = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <DynamicToastProvider>
      <DynamicFuturisticDashboard />
    </DynamicToastProvider>
  );
};

export default EnhancedDashboard;
