/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
<<<<<<< HEAD
  webpack: (config, { isServer }) => {
    // Handle node: protocol imports for browser
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
=======
  serverExternalPackages: ["pino", "pino-pretty", "thread-stream"],
  turbopack: {},
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      tap: false,
      tape: false,
    };
>>>>>>> 0a786e0d6eebf726fff98f3bda559b977bfaa3c1
    return config;
  },
}

export default nextConfig
