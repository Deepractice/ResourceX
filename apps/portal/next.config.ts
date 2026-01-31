import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: [
    "@resourcexjs/server",
    "@resourcexjs/core",
    "@resourcexjs/registry",
    "@resourcexjs/storage",
  ],
};

export default nextConfig;
