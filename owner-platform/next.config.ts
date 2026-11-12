import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  basePath: '/owner-portal',
  compiler: {
    removeConsole: false,
  },
};

export default nextConfig;
