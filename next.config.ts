import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack handles WASM natively in Next.js 16
  turbopack: {},
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
