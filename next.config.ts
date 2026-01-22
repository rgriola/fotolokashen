import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Validate environment variables at build/startup time
import './src/lib/env';


const nextConfig: NextConfig = {
  // Exclude problematic packages from server components bundle
  // exifr and its dependencies (jsdom, parse5) should only run on the client
  // isomorphic-dompurify uses jsdom which has ES Module issues in serverless
  serverExternalPackages: ['exifr', 'jsdom', 'parse5', 'isomorphic-dompurify'],

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
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com", // Google Maps needs inline scripts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // Allow Google Fonts
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://ik.imagekit.io https://maps.googleapis.com https://maps.gstatic.com https://*.tile.openstreetmap.org", // ImageKit, Google Maps, OSM
              "connect-src 'self' https://maps.googleapis.com https://upload.imagekit.io https://ik.imagekit.io https://o4510596205838336.ingest.us.sentry.io", // API, ImageKit, Sentry
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

// Wrap with Sentry config
export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "rod-griola",  // Must match Sentry auth token organization
  project: "fotolokashen",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Configure source maps
  sourcemaps: {
    disable: false, // Enable source maps for better error tracking
  },

  // Webpack-specific options (fixes deprecation warnings)
  webpack: {
    // Automatically tree-shake Sentry logger statements to reduce bundle size
    treeshake: {
      removeDebugLogging: true,  // Replaces deprecated disableLogger
    },

    // Automatically annotate React components to show their full name in breadcrumbs and session replay
    reactComponentAnnotation: {
      enabled: true,  // Moved from top level
    },

    // Enables automatic instrumentation of Vercel Cron Monitors
    automaticVercelMonitors: true,  // Moved from top level
  },
});


