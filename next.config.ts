import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "assets.mixkit.co",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
      },
      {
        protocol: "https",
        hostname: "api.qrserver.com",
      },
      {
        protocol: "https",
        hostname: "media.lumiardi.com",
      },
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), display-capture=(self), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://images.unsplash.com https://assets.mixkit.co https://raw.githubusercontent.com https://cdn.jsdelivr.net https://*.githubusercontent.com https://api.qrserver.com https://media.lumiardi.com https://*.r2.cloudflarestorage.com https://*.cloudflarestorage.com",
              "media-src 'self' data: blob: https://assets.mixkit.co https://commondatastorage.googleapis.com https://*.r2.cloudflarestorage.com https://*.cloudflarestorage.com",
              "connect-src 'self' blob: data: wss: https: https://fonts.googleapis.com https://fonts.gstatic.com https://images.unsplash.com https://raw.githubusercontent.com https://*.githubusercontent.com https://cdn.jsdelivr.net https://dl.polyhaven.org https://market-assets.fra1.cdn.digitaloceanspaces.com https://bill.ccbill.com https://*.nowpayments.io https://api.sumsub.com https://*.r2.cloudflarestorage.com https://*.cloudflarestorage.com",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self' https://bill.ccbill.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/images/:path*",
        destination: "/api/media/assets/images/:path*",
      },
    ];
  },
};

export default nextConfig;
