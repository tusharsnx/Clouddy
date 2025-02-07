import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // We want our app to run without servers, which means we can't use
  // any Dynamic Components in our app. Setting output to "export" will
  // ensure that the app is built as a static site and throws if
  // it can't.
  output: "export",

  experimental: {
    reactCompiler: true,
  }
};

export default nextConfig;
