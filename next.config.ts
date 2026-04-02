import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Add your Supabase storage host so next/image can load external
    // images served from Supabase storage. Replace or extend this list
    // if you use other hosts.
    domains: ['lcwukedhkgjtqedxrufj.supabase.co'],
  },
  /* config options here */
};

export default nextConfig;
