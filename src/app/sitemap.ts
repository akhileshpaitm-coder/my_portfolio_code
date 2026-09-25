import type { MetadataRoute } from "next";
import { getPublishedSlugsWithDates } from "@/lib/blog";
import { getCategories } from "@/lib/blog-categories";
import { getTags } from "@/lib/blog-tags";

/**
 * Dynamic sitemap: static portfolio pages + published blog posts,
 * category/tag filter pages. Blog queries are wrapped so a DB hiccup
 * never breaks sitemap generation (static entries still ship).
 */
export const dynamic = "force-dynamic";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://akhileshprajapati.dev";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/skills`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/expertise`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/projects`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/tech-stack`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/blog`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/contact`, changeFrequency: "yearly", priority: 0.5 },
  ];

  try {
    const [posts, categories, tags] = await Promise.all([
      getPublishedSlugsWithDates(),
      getCategories(),
      getTags(),
    ]);

    const postUrls: MetadataRoute.Sitemap = posts.map((p) => ({
      url: `${BASE_URL}/blog/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: "monthly",
      priority: 0.8,
    }));

    const categoryUrls: MetadataRoute.Sitemap = categories
      .filter((c) => c.post_count > 0)
      .map((c) => ({
        url: `${BASE_URL}/blog?category=${c.slug}`,
        changeFrequency: "weekly",
        priority: 0.4,
      }));

    const tagUrls: MetadataRoute.Sitemap = tags
      .filter((t) => t.post_count > 0)
      .map((t) => ({
        url: `${BASE_URL}/blog?tag=${t.slug}`,
        changeFrequency: "weekly",
        priority: 0.3,
      }));

    return [...staticPages, ...postUrls, ...categoryUrls, ...tagUrls];
  } catch {
    return staticPages;
  }
}
