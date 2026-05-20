import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "loremflickr.com" },
      // Supabase Storage (product images uploaded from the admin panel).
      // The wildcard covers any project; the path filter narrows it to
      // the public bucket endpoint so other paths can't be served as
      // images.
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;
