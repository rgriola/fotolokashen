import type { NextConfig } from "next";

// Validate environment variables at build/startup time
import './src/lib/env';


const nextConfig: NextConfig = {
  // Exclude problematic packages from server components bundle
  // exifr and its dependencies (jsdom, parse5) should only run on the client
  // isomorphic-dompurify uses jsdom which has ES Module issues in serverless
  serverExternalPackages: ['exifr', 'jsdom', 'parse5', 'isomorphic-dompurify'],

  // Turbopack is default in Next.js 16 - empty config silences webpack migration warning
  turbopack: {},

  webpack: (config, { isServer }) => {
    // Externalize these packages to prevent bundling on the server
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        'exifr',
        'jsdom',
        'parse5',
        'canvas',
        'bufferutil',
        'utf-8-validate',
        'isomorphic-dompurify',
      ];
    }
    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
        pathname: '/rgriola/**',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
      },
    ],
  },

  // Security Headers
  async headers() {
    const headers = [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          // Prevent clickjacking attacks
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Enable browser XSS protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          // Permissions Policy (formerly Feature Policy)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
          },
          // Content Security Policy (CSP)
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com https://cdn.jsdelivr.net https://va.vercel-scripts.com", // Google Maps + Monaco Editor CDN + Vercel Speed Insights
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net", // Google Fonts + Monaco CSS
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://ik.imagekit.io https://maps.googleapis.com https://maps.gstatic.com https://*.tile.openstreetmap.org", // ImageKit, Google Maps, OSM
              "connect-src 'self' https://maps.googleapis.com https://upload.imagekit.io https://ik.imagekit.io https://cdn.jsdelivr.net https://va.vercel-scripts.com https://vitals.vercel-insights.com", // API, ImageKit, Monaco source maps, Vercel Speed Insights
              "worker-src 'self' blob:", // Allow Monaco Editor web workers
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
    ];

    // Add HSTS only in production
    if (process.env.NODE_ENV === 'production') {
      headers.push({
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      });
    }

    return headers;
  },
};

export default nextConfig;


