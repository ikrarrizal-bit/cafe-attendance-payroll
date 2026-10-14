import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/data': ['./public/fonts/Geist-Regular.ttf'],
  },
};

export default nextConfig;
