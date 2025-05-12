import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    typescript: {
        // Temporarily disable TypeScript errors during build
        ignoreBuildErrors: true,
      },
};

export default nextConfig;
