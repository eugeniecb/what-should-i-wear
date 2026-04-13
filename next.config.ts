import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Old route, kept so existing bookmarks land on the renamed page.
      { source: "/dashboard", destination: "/today", permanent: true },
    ];
  },
};

export default nextConfig;
