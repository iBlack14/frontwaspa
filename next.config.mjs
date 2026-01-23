/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
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
        hostname: "wasapi-supabase.ld4pxg.easypanel.host",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
