import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the standalone VM release, but let Netlify's Next.js adapter manage
  // its own function output and request routing.
  output: process.env.NETLIFY ? undefined : "standalone",
  /* config options here */
  reactStrictMode: false,
  env: {
    ...(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
      ? { NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL }
      : {}),
    ...(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || process.env.SUPABASE_STORAGE_BUCKET
      ? { NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || process.env.SUPABASE_STORAGE_BUCKET }
      : {}),
  },
  images: {
    remotePatterns: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
      ? [{ protocol: "https", hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!).hostname, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    }]
  },
};

export default nextConfig;
