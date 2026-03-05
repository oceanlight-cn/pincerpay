import { getAllDocs, getAllBlogPosts } from "@/lib/content";
import { BASE_URL } from "@/lib/constants";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const docs = getAllDocs().map((doc) => ({
    url: `${BASE_URL}/docs/${doc.meta.slug}`,
    lastModified: new Date(doc.lastModified),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const blog = getAllBlogPosts().map((post) => ({
    url: `${BASE_URL}/blog/${post.meta.slug}`,
    lastModified: new Date(post.meta.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/docs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date("2026-03-05"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date("2026-03-05"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...docs,
    ...blog,
  ];
}
