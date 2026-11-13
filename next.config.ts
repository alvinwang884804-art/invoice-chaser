import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use turbopack (default in Next.js 16) with no extra webpack config needed.
  // better-sqlite3 is a native module used only in server routes — it works
  // fine with Turbopack's server-side bundling.
  turbopack: {},
};

export default nextConfig;
