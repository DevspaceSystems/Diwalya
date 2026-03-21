import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['firebase-admin'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ijjwonaqazkejglezcdr.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // You can add more patterns if needed. For instance, if user profiles contain general https links:
      {
        protocol: 'https',
        hostname: '**',
      }
    ],
  },
};

export default nextConfig;
