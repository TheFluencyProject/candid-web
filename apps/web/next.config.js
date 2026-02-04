const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
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
        source: "/download",
        destination: "https://apps.apple.com/app/id6754859158",
        permanent: true,
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
