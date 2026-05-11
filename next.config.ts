import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "f4.bcbits.com",
      },
    ],
  },

  async redirects() {
    return [
      {
        source: "/support",
        destination: "/support-the-project",
        permanent: true,
      },
      {
        source: "/support/success",
        destination: "/support-the-project/success",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;