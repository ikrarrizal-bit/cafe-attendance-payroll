import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/", name: "Café Team | Attendance & Payroll", short_name: "Café Team",
    description: "Staff attendance, selfies and payroll for your café.",
    start_url: "/staff", scope: "/", display: "standalone",
    background_color: "#f8fafc", theme_color: "#164e63",
    icons: [
      { src: "/app-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
