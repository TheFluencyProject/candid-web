const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    // 1y cache for /_next/image outputs — URLs are content-addressed; new content = new URL.
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tfp-tutors.s3.us-west-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.cloudfront.net",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/beta",
        destination: "https://testflight.apple.com/join/27TjqWk3",
        permanent: true,
      },
      // App Store redirects (/download, /join, /app, etc.) are handled in
      // middleware.ts so we can branch on User-Agent for non-iOS waitlist.
      {
        source: "/adam",
        destination: "/guide/english-adam",
        permanent: true,
      },
      {
        source: "/mia",
        destination: "/guide/korean-mia",
        permanent: true,
      },
      {
        source: "/misshoney",
        destination: "/guide/misshoney",
        permanent: true,
      },
      {
        source: "/chan",
        destination: "/guide/korean-chan",
        permanent: true,
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
