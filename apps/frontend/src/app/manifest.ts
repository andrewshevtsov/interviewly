import type { MetadataRoute } from "next";

/**
 * Web App Manifest: иконки и цвета для установки на домашний экран (Android, десктопные PWA).
 * @returns {MetadataRoute.Manifest} Манифест приложения.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Interviewly",
    short_name: "Interviewly",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0D14",
    theme_color: "#0A0D14",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
