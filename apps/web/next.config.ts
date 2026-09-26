import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@napayment/api-client", "@napayment/format", "@napayment/schemas", "@napayment/ui-tokens"],
};

export default nextConfig;
