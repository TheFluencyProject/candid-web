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
        destination: "/tutor/english-adam",
        permanent: true,
      },
      {
        source: "/mia",
        destination: "/tutor/korean-mia",
        permanent: true,
      },
      {
        source: "/misshoney",
        destination: "/tutor/misshoney",
        permanent: true,
      },
      {
        source: "/chan",
        destination: "/tutor/korean-chan",
        permanent: true,
      },
      // /guide/:slug was renamed to /tutor/:slug (commit c4ce9b5). The short
      // links above used to 308 → /guide/:slug, and browsers cache permanent
      // redirects — so already-visited /adam etc. still point at /guide. Keep
      // this rule so those cached/bookmarked/indexed URLs resolve instead of
      // 404ing. Do NOT hard-cut /guide again.
      {
        source: "/guide/:slug",
        destination: "/tutor/:slug",
        permanent: true,
      },
      {
        source: "/ko/guide/:slug",
        destination: "/ko/tutor/:slug",
        permanent: true,
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
