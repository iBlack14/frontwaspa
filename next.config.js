/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración de WebSockets
  webpack: (config, { isServer }) => {
    // Configuración para el cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        dns: false,
        fs: false,
        child_process: false,
      };
    }

    return config;
  },
  // Configuración de redirecciones y reescrituras si es necesario
  async rewrites() {
    return [
      {
        source: '/api/ws',
        destination: '/api/ws',
      },
    ];
  },
  // Configuración de encabezados para WebSockets
  async headers() {
    return [
      {
        source: '/api/ws',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
  // Configuración de imágenes si es necesario
  images: {
    domains: ['localhost', 'tu-dominio.com'],
  },
};

module.exports = nextConfig;
