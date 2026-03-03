import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@pincerpay/merchant", "@pincerpay/core"],
};

export default nextConfig;
