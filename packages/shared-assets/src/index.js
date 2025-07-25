// Centralized asset paths for the ERP system
export const ASSETS = {
  // Favicons
  favicon: "/favicon.svg",
  faviconIco: "/favicon.ico",
  faviconPng: "/favicon-96x96.png",

  // App Icons
  icon32: "/icon-32.png",
  icon64: "/icon-64.png",
  icon192: "/icon-192.png",
  icon512: "/icon-512.png",
  appleTouchIcon: "/apple-touch-icon.png",

  // Axiologic Logos
  axiologicLogo32: "/axiologic_logo_32.png",
  axiologicLogo64: "/axiologic_logo_64.png",
  axiologicLogo128: "/axiologic_logo_128.png",
  axiologicLogo256: "/axiologic_logo_256.png",
  axiologicLogo512: "/axiologic_logo_512.png",
};

// Web app manifest configuration
export const MANIFEST = {
  name: "Axiologic ERP",
  short_name: "Axiologic",
  description:
    "Greek Business Management System with multi-tenant architecture and AADE compliance",
  start_url: "/",
  display: "standalone",
  theme_color: "#0066CC",
  background_color: "#ffffff",
  icons: [
    {
      src: ASSETS.icon192,
      sizes: "192x192",
      type: "image/png",
      purpose: "maskable",
    },
    {
      src: ASSETS.icon512,
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
};
