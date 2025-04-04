import type { NextConfig } from "next";

const nextConfig = {
  // This is a client-only app. Only allow static or client-only
  // components in the project.
  output: "export",

  experimental: {
    reactCompiler: true,
  },
} satisfies NextConfig;

export default nextConfig;
