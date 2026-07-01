import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Envelope Budgeting",
    short_name: "Envelope",
    description: "Simple personal finance app for tracking expenses and budgets.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f4f5",
    theme_color: "#2563eb",
  };
}
