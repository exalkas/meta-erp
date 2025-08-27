/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable React strict mode to reduce double loading
  transpilePackages: ["@erp/shared-ui", "@erp/dynamic-entities"],
  experimental: {
    turbo: {
      resolveAlias: {
        underscore: "lodash",
        mocha: { browser: "mocha/browser-entry.js" },
      },
    },
  },
  env: {
    NEXT_PUBLIC_APP_NAME: "Legal Practice Management",
    NEXT_PUBLIC_APP_VERSION: "1.0.0",
    NEXT_PUBLIC_VERTICAL: "LEGAL",
    NEXT_PUBLIC_PACK_ID: "LEGAL-US",
  },
};

module.exports = nextConfig;
