/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@dosson-architecture-visualizer/shared'],
  outputFileTracingRoot: path.join(__dirname, '../../'),
  experimental: {
    optimizePackageImports: ['lucide-react', '@xyflow/react'],
  },
};

module.exports = nextConfig;
