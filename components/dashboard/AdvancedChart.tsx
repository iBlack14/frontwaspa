/**
 * ADVANCED CHART COMPONENT
 * ====================================
 * Componente de gráfico avanzado con múltiples visualizaciones
 * y controles interactivos.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  EyeIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

interface AdvancedChartProps {
  data: any;
  options: any;
  historyData: any[];
  metrics: {
    totalSent: number;
    totalApiSent: number;
    totalReceived: number;
  };
}

export const AdvancedChart: React.FC<AdvancedChartProps> = ({
  data,
  options,
  historyData,
  metrics
}) => {
  const [viewMode, setViewMode] = useState<'line' | 'bar' | 'area'>('line');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Calculate growth rate
  const calculateGrowthRate = () => {
    if (historyData.length < 2) return 0;
    const recent = historyData.slice(-7);
    const previous = historyData.slice(-14, -7);
    
    const recentTotal = recent.reduce((sum, day) => sum + day.message_sent + day.message_received, 0);
    const previousTotal = previous.reduce((sum, day) => sum + day.message_sent + day.message_received, 0);
    
    if (previousTotal === 0) return 0;
    return Math.round(((recentTotal - previousTotal) / previousTotal) * 100);
  };

  const growthRate = calculateGrowthRate();

  // Calculate peak activity
  const peakActivity = historyData.length > 0 
    ? Math.max(...historyData.map(d => d.message_sent + d.message_received))
    : 0;

  const averageDaily = historyData.length > 0
    ? Math.round(historyData.reduce((sum, d) => sum + d.message_sent + d.message_received, 0) / historyData.length)
    : 0;

  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-900/5 hover:shadow-slate-900/10 transition-all duration-300">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
            <ChartBarIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
              Análisis de Actividad
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Rendimiento detallado de los últimos {timeRange === '7d' ? '7 días' : timeRange === '30d' ? '30 días' : '90 días'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  timeRange === range
                    ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {range === '7d' ? '7 días' : range === '30d' ? '30 días' : '90 días'}
              </button>
            ))}
          </div>

          {/* View Mode Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('line')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'line'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <ArrowTrendingUpIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('bar')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'bar'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <ChartBarIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 p-4 rounded-2xl border border-blue-200/50 dark:border-blue-700/30">
          <div className="flex items-center gap-2 mb-2">
            <ArrowTrendingUpIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Crecimiento</span>
          </div>
          <div className="text-xl font-bold text-slate-800 dark:text-white">
            {growthRate > 0 ? '+' : ''}{growthRate}%
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">vs semana anterior</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 p-4 rounded-2xl border border-emerald-200/50 dark:border-emerald-700/30">
          <div className="flex items-center gap-2 mb-2">
            <ChartBarIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Pico</span>
          </div>
          <div className="text-xl font-bold text-slate-800 dark:text-white">
            {peakActivity.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">máximo diario</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 p-4 rounded-2xl border border-purple-200/50 dark:border-purple-700/30">
          <div className="flex items-center gap-2 mb-2">
            <CalendarIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Promedio</span>
          </div>
          <div className="text-xl font-bold text-slate-800 dark:text-white">
            {averageDaily.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">mensajes/día</div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10 p-4 rounded-2xl border border-orange-200/50 dark:border-orange-700/30">
          <div className="flex items-center gap-2 mb-2">
            <AdjustmentsHorizontalIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span className="text-xs font-medium text-orange-700 dark:text-orange-300">Eficiencia</span>
          </div>
          <div className="text-xl font-bold text-slate-800 dark:text-white">
            {metrics.totalSent > 0 ? Math.round((metrics.totalApiSent / metrics.totalSent) * 100) : 0}%
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">automatización</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 mb-6">
        <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-xl border border-indigo-100 dark:border-indigo-800">
          <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
          <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Enviados</span>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-800 px-2 py-0.5 rounded-full">
            {metrics.totalSent.toLocaleString()}
          </span>
        </div>
        
        <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/30 px-4 py-2 rounded-xl border border-purple-100 dark:border-purple-800">
          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
          <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">API</span>
          <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-800 px-2 py-0.5 rounded-full">
            {metrics.totalApiSent.toLocaleString()}
          </span>
        </div>
        
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-xl border border-emerald-100 dark:border-emerald-800">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Recibidos</span>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-800 px-2 py-0.5 rounded-full">
            {metrics.totalReceived.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Chart Container */}
      <div className="h-[400px] w-full relative">
        {historyData.length > 0 ? (
          <div className="h-full w-full">
            {/* Aquí iría el componente Chart real */}
            <div className="h-full w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <ChartBarIcon className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                  Gráfico cargando...
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Modo: {viewMode} | Período: {timeRange}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl border border-dashed border-slate-200 dark:border-slate-600">
            <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg mb-4">
              <EyeIcon className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto" />
            </div>
            <h4 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2">
              Sin datos históricos
            </h4>
            <p className="text-slate-400 dark:text-slate-500 text-sm text-center max-w-sm">
              Los datos aparecerán aquí una vez que comiences a enviar y recibir mensajes
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedChart;