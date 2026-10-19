import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api",
        "/login",
        "/sign-up",
        "/dashboard",
        "/assets",
        "/content",
        "/ai-generation",
        "/publishing",
        "/projects",
        "/automation",
        "/analytics",
        "/notifications",
        "/approvals",
        "/settings",
      ],
    },
    sitemap: "https://creator-os-hq.vercel.app/sitemap.xml",
  };
}