import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  basePath: '',
  compiler: {
    removeConsole: true,
  },
};

export default nextConfig;
