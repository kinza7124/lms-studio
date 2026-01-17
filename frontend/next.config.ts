import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Optimize images if using external image domains
  images: {
    domains: ['ubiquitous-robot-4jj77vrq6rwvc79q-5000.app.github.dev'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.app.github.dev',
      },
    ],
  },
  
  // Environment variables that should be available at build time
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  
  // Enable SWC minification for better performance
  swcMinify: true,
  
  // Disable type checking during build (run separately in CI)
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Disable ESLint during build (run separately in CI)
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
