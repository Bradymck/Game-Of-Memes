/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["pino", "pino-pretty", "thread-stream"],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      tap: false,
      tape: false,
    };
    return config;
  },
}

export default nextConfig
