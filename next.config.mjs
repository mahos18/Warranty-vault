/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,  // ← disables ESLint during vercel build
  },
  typescript: {
    ignoreBuildErrors: false,  // ← keep TS errors visible
  },
};

export default nextConfig;