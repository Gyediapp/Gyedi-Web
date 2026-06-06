import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/escrow/', '/wallet/', '/profile/', '/my-store/', '/my-listings/', '/history/', '/send/', '/verify/', '/login/', '/register/', '/dashboard/', '/notifications/', '/cart/', '/favourites/', '/watermark/'],    },
    sitemap: 'https://gyedi.app/sitemap.xml',
  };
}