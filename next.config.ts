import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "xnmlzimdpawdqikgbpvw.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "pub-b96989cc617f460facb9c254b7d2c5db.r2.dev",
      },
    ],
  },

};

export default nextConfig;
