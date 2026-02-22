import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@pincerpay/core", "@pincerpay/db", "@pincerpay/solana"],
  serverExternalPackages: ["postgres"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Wallet adapter relies on Node.js builtins that need polyfills in browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        stream: false,
        buffer: false,
        http: false,
        https: false,
        zlib: false,
        url: false,
      };
    }
    return config;
  },
};

export default nextConfig;
