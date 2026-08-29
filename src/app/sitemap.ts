import { type MetadataRoute } from 'next'

import { navigation } from '@/lib/navigation'
import { site } from '@/lib/site'

// Derived from the sidebar so a new page cannot be added to the docs without
// also landing in the sitemap.
export default function sitemap(): MetadataRoute.Sitemap {
  return navigation
    .flatMap((section) => section.links)
    .map((link) => ({
      url: new URL(link.href, site.url).toString(),
      changeFrequency: 'weekly' as const,
      priority: link.href === '/' ? 1 : 0.8,
    }))
}
