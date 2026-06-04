import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://gyedi.app';

  // Static pages
  const staticPages = [
    { url: baseUrl,                  lastModified: new Date(), changeFrequency: 'daily' as const,   priority: 1.0 },
    { url: `${baseUrl}/marketplace`, lastModified: new Date(), changeFrequency: 'hourly' as const,  priority: 0.9 },
    { url: `${baseUrl}/guide`,       lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/pricing`,     lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${baseUrl}/community`,   lastModified: new Date(), changeFrequency: 'daily' as const,   priority: 0.7 },
    { url: `${baseUrl}/blog`,        lastModified: new Date(), changeFrequency: 'daily' as const,   priority: 0.6 },
    { url: `${baseUrl}/privacy`,     lastModified: new Date(), changeFrequency: 'yearly' as const,  priority: 0.3 },
    { url: `${baseUrl}/terms`,       lastModified: new Date(), changeFrequency: 'yearly' as const,  priority: 0.3 },
  ];

  // Dynamic listing pages
  let listingPages: MetadataRoute.Sitemap = [];
  try {
    const listings = await prisma.listing.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, updatedAt: true },
      take: 1000,
    });
    listingPages = listings.map(l => ({
      url:             `${baseUrl}/listing/${l.id}`,
      lastModified:    l.updatedAt,
      changeFrequency: 'weekly' as const,
      priority:        0.6,
    }));
  } catch {}

  // Store pages
  let storePages: MetadataRoute.Sitemap = [];
  try {
    const stores = await (prisma as any).user.findMany({
      where: { storeActive: true },
      select: { id: true, updatedAt: true },
      take: 500,
    });
    storePages = stores.map((s: any) => ({
      url:             `${baseUrl}/store/${s.id}`,
      lastModified:    s.updatedAt,
      changeFrequency: 'weekly' as const,
      priority:        0.5,
    }));
  } catch {}

  return [...staticPages, ...listingPages, ...storePages];
}