import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack handles WASM natively in Next.js 16
  turbopack: {},
  // Permite acessar o dev server pelo IP da LAN (não só localhost).
  // O Next.js bloqueia por padrão requisições cross-origin a recursos de dev
  // (_next/static/*, HMR, RSC) quando a origem não é localhost.
  allowedDevOrigins: ['192.168.3.94', '192.168.3.*'],
  // Allow WASM files to be served with correct content type
  headers: async () => [
    {
      source: "/(.*)\\.wasm",
      headers: [
        {
          key: "Content-Type",
          value: "application/wasm",
        },
      ],
    },
  ],
};

export default nextConfig;
