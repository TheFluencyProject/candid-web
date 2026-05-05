const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tfp-tutors.s3.us-west-1.amazonaws.com",
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
      {
        source: "/join",
        destination: "https://apps.apple.com/app/id6754859158",
        permanent: true,
      },
      {
        source: "/app",
        destination: "https://apps.apple.com/app/id6754859158",
        permanent: true,
      },
      {
        source: "/studywithus",
        destination: "https://apps.apple.com/app/id6754859158",
        permanent: true,
      },
      {
        source: "/learnwithus",
        destination: "https://apps.apple.com/app/id6754859158",
        permanent: true,
      },
      {
        source: "/redirects/adam",
        destination: "https://apps.apple.com/app/id6754859158?ppid=a5bb8fc4-a398-442f-b401-92c2cc1e050a",
        permanent: false,
      },
      {
        source: "/redirects/mia",
        destination: "https://apps.apple.com/app/id6754859158?ppid=86959fbf-bcba-4bea-829f-5b7d73270854",
        permanent: false,
      },
      {
        source: "/download/english-adam",
        destination: "https://apps.apple.com/app/id6754859158?ppid=a5bb8fc4-a398-442f-b401-92c2cc1e050a",
        permanent: false,
      },
      {
        source: "/download/korean-mia",
        destination: "https://apps.apple.com/app/id6754859158?ppid=86959fbf-bcba-4bea-829f-5b7d73270854",
        permanent: false,
      },
      {
        source: "/download/:slug",
        destination: "https://apps.apple.com/app/id6754859158",
        permanent: false,
      },
      {
        source: "/download",
        destination: "https://apps.apple.com/app/id6754859158",
        permanent: true,
      },
      {
        source: "/startup",
        destination: "https://apps.apple.com/app/id6754859158",
        permanent: true,
      },
      {
        source: "/startups",
        destination: "https://apps.apple.com/app/id6754859158?ppid=c038ad6e-6323-481e-95fd-2dadeb0bd04d",
        permanent: true,
      },
      {
        source: "/englishmode",
        destination: "https://apps.apple.com/app/id6754859158?ppid=ppid=a34b9b94-7d2a-4fac-b792-6e59fb0e5e59",
        permanent: true,
      },
      {
        source: "/business",
        destination: "https://apps.apple.com/app/id6754859158?ppid=a5bb8fc4-a398-442f-b401-92c2cc1e050a",
        permanent: true,
      },
      {
        source: "/news",
        destination: "https://apps.apple.com/app/id6754859158?ppid=86959fbf-bcba-4bea-829f-5b7d73270854",
        permanent: true,
      },
      {
        source: "/beauty",
        destination: "https://apps.apple.com/app/id6754859158",
        permanent: true,
      },
      {
        source: "/wellness",
        destination: "https://apps.apple.com/app/id6754859158",
        permanent: true,
      },
      {
        source: "/basketball",
        destination: "https://apps.apple.com/app/id6754859158",
        permanent: true,
      },
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
