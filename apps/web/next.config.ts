import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@napayment/api-client", "@napayment/bff", "@napayment/format", "@napayment/schemas", "@napayment/ui", "@napayment/ui-tokens"],
};

export default nextConfig;
