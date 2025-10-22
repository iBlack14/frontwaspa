import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Optimizaciones de rendimiento
  reactStrictMode: true,
  
  // ✅ Optimización de compilación
  experimental: {
    optimizePackageImports: ['@heroicons/react', 'chart.js', 'react-chartjs-2'],
  },
  
  // ✅ Excluir carpetas problemáticas del watcher (CRÍTICO para rendimiento)
  webpack: (config, { isServer }) => {
    // Excluir backend/sessions del watch (8900+ archivos causan lentitud extrema)
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/backend/sessions/**',
        '**/backend/node_modules/**',
        '**/.next/**',
        '**/.git/**',
      ],
    };
    
    // Configurar alias @ para resolver src/*
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    
    return config;
  },
  
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "wazilrest-wordpress.xwk85y.easypanel.host",
      },
      {
        protocol: "https",
        hostname: "wazilrest-strapi.xwk85y.easypanel.host",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
     {
        protocol: "https",
        hostname: "content.wazilrest.com",
      },
      {
        protocol: "https",
        hostname: "n8n.io",
      },
      {
        protocol: "https",
        hostname: "supabase.com",
      },
      {
        protocol: "https",
        hostname: "strapi.io",
      },
      {
        protocol: "https",
        hostname: "blxk-supabase.1mrj9n.easypanel.host",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
    // ✅ Optimización de imágenes
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  
  // ✅ Comprimir respuestas
  compress: true,
};

export default nextConfig;
