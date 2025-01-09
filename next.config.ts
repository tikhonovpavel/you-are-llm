import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/you-are-llm',
  images: {
    unoptimized: true
  }
};

export default nextConfig;