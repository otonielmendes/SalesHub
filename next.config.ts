import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  async redirects() {
    return [
      {
        source: "/backtests/testagens",
        destination: "/backtests/new",
        permanent: false,
      },
      {
        source: "/calculadora/calculo",
        destination: "/calculadora/new",
        permanent: false,
      },
      {
        source: "/demos",
        destination: "/fingerprinting/new",
        permanent: false,
      },
      {
        source: "/demos/device-fingerprinting",
        destination: "/fingerprinting/new",
        permanent: false,
      },
      {
        source: "/demos/device-fingerprinting/nova",
        destination: "/fingerprinting/new",
        permanent: false,
      },
      {
        source: "/demos/device-fingerprinting/historico",
        destination: "/fingerprinting/history",
        permanent: false,
      },
      {
        source: "/demos/device-fingerprinting/:id",
        destination: "/fingerprinting/:id",
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
