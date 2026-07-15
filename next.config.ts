import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["redoc", "swagger-ui-react", "swagger-client"],
};

export default nextConfig;
