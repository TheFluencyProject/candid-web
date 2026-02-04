/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/privacy",
        destination:
          "https://thefluencyproject.notion.site/englishmodeprivacy",
        permanent: true,
      },
      // {
      //   source: "/designvision",
      //   destination:
      //     "https://thefluencyproject.notion.site/Amiko-Design-Vision-233bc1de5e34809f90a5ea76a28ac46a",
      //   permanent: true,
      // },
      {
        source: "/beta",
        destination: "https://testflight.apple.com/join/27TjqWk3",
        permanent: true,
      },
      // {
      //   source: "/getearlyaccess",
      //   destination:
      //     "https://thefluencyproject.notion.site/228bc1de5e34801daa60c0efb4687a13?pvs=105",
      //   permanent: true,
      // },
      // {
      //   source: "/waitlist",
      //   destination:
      //   "https://thefluencyproject.notion.site/228bc1de5e34801daa60c0efb4687a13?pvs=105",
      //   permanent: true,
      // },
      //we dont need the below bc we already have the join page
      // {
      //   source: "/join",
      //   destination:
      //     "https://thefluencyproject.notion.site/joinbloom",
      //   permanent: true,
      // },
      // {
      //   source: "/earlyaccess",
      //   destination:
      //     "https://thefluencyproject.notion.site/228bc1de5e34801daa60c0efb4687a13?pvs=105",
      //   permanent: true,
      // },
      {
        source: "/app",
        destination: "https://apps.apple.com/app/id6754859158",
        permanent: true,
      },
      {
        source: "/join",
        destination: "https://apps.apple.com/app/id6754859158",
        permanent: true,
      },
      // {
      //   source: "/download",
      //   destination: "https://apps.apple.com/app/id6747585093",
      //   permanent: true,
      // },
      {
        source: "/terms",
        destination:
          "https://thefluencyproject.notion.site/englishmodeterms",
        permanent: true,
      },
      {
        source: "/privacy-ko",
        destination:
          "https://thefluencyproject.notion.site/englishmodeprivacy-ko",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
