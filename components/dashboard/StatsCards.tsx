/**
 * ADVANCED STATS CARDS COMPONENT
 * ====================================
 * Componente de tarjetas de estadísticas avanzadas con animaciones
 * y visualizaciones mejoradas para el dashboard.
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  icon: React.ComponentType<any>;
  gradient: string;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  gradient,
  delay = 0
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -8 }}
      className={`group relative ${gradient} p-8 rounded-3xl border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden`}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-500"></div>
      <div className="absolute -bottom-2 -left-2 w-20 h-20 bg-black/10 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
          </div>
          
          {trend && (
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl backdrop-blur-sm border ${
              trend.isPositive 
                ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-100' 
                : 'bg-red-500/20 border-red-400/30 text-red-100'
            }`}>
              {trend.isPositive ? (
                <ArrowUpIcon className="w-3 h-3" />
              ) : (
                <ArrowDownIcon className="w-3 h-3" />
              )}
              <span className="text-xs font-bold">{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium text-white/80 mb-1">{title}</h3>
            <div className="text-3xl font-black text-white tracking-tight">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
          </div>
          
          {subtitle && (
            <p className="text-sm text-white/70">{subtitle}</p>
          )}
          
          {trend && (
            <p className="text-xs text-white/60">
              {trend.isPositive ? '+' : ''}{trend.value}% vs {trend.period}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

interface StatsCardsProps {
  metrics: {
    totalSent: number;
    totalApiSent: number;
    totalReceived: number;
  };
  activeInstances: number;
  totalInstances: number;
  historyData: any[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  metrics,
  activeInstances,
  totalInstances,
  historyData
}) => {
  // Calculate trends (mock data for now)
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.round(Math.abs(change)),
      isPositive: change >= 0
    };
  };

  // Mock previous period data (you can replace with real data)
  const previousMetrics = {
    totalSent: Math.round(metrics.totalSent * 0.85),
    totalReceived: Math.round(metrics.totalReceived * 0.92),
    totalApiSent: Math.round(metrics.totalApiSent * 0.78),
    activeInstances: Math.max(1, activeInstances - 1)
  };

  const stats = [
    {
      title: 'Mensajes Enviados',
      value: metrics.totalSent,
      subtitle: 'Total acumulado',
      trend: {
        ...calculateTrend(metrics.totalSent, previousMetrics.totalSent),
        period: 'mes anterior'
      },
      icon: ChatBubbleLeftRightIcon,
      gradient: 'bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600',
      delay: 0
    },
    {
      title: 'Mensajes API',
      value: metrics.totalApiSent,
      subtitle: 'Automatizados',
      trend: {
        ...calculateTrend(metrics.totalApiSent, previousMetrics.totalApiSent),
        period: 'mes anterior'
      },
      icon: SparklesIcon,
      gradient: 'bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600',
      delay: 0.1
    },
    {
      title: 'Mensajes Recibidos',
      value: metrics.totalReceived,
      subtitle: 'Total entrantes',
      trend: {
        ...calculateTrend(metrics.totalReceived, previousMetrics.totalReceived),
        period: 'mes anterior'
      },
      icon: ArrowTrendingUpIcon,
      gradient: 'bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600',
      delay: 0.2
    },
    {
      title: 'Instancias Activas',
      value: `${activeInstances}/${totalInstances}`,
      subtitle: `${totalInstances > 0 ? Math.round((activeInstances / totalInstances) * 100) : 0}% conectadas`,
      trend: {
        ...calculateTrend(activeInstances, previousMetrics.activeInstances),
        period: 'mes anterior'
      },
      icon: UserGroupIcon,
      gradient: 'bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600',
      delay: 0.3
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default StatsCards;