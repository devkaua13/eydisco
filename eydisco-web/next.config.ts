import type { NextConfig } from "next"

const apiUrl = new URL(process.env.API_URL ?? "http://localhost:8000")

const nextConfig: NextConfig = {
  images: {
    // Capas e avatares vêm do /media/ do Django.
    remotePatterns: [
      {
        protocol: apiUrl.protocol.replace(":", "") as "http" | "https",
        hostname: apiUrl.hostname,
        port: apiUrl.port,
        pathname: "/media/**",
      },
    ],
    // Em desenvolvimento a API roda em localhost, que o otimizador bloqueia por padrão.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
  },
  experimental: {
    // Foto de capa da House passa por Server Action; o padrão é 1 MB.
    serverActions: { bodySizeLimit: "8mb" },
  },
  // A página do lançamento virou a página do Disc.
  async redirects() {
    return [
      {
        source: "/lancamentos/:path*",
        destination: "/discos/:path*",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
