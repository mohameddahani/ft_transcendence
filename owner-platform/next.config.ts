import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  basePath: '/owner-portal',
  compiler: {
    removeConsole: true,
  },
};

export default nextConfig;
