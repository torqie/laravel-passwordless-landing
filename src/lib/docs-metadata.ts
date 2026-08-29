import fs from 'node:fs'
import path from 'node:path'

import { type Metadata } from 'next'
import yaml from 'js-yaml'

import { site } from '@/lib/site'

type Frontmatter = {
  title?: string
  nextjs?: { metadata?: Metadata }
}

/**
 * `@markdoc/next.js` cannot export `metadata` from a .md page under the App
 * Router — Next rejects it as a client-component export — so each docs segment
 * gets a passthrough layout that reads its own page's frontmatter instead.
 * Without this every page inherits the site title and description verbatim.
 */
export function docsMetadata(slug: string): Metadata {
  let source = fs.readFileSync(
    path.join(process.cwd(), 'src/app/docs', slug, 'page.md'),
    'utf8',
  )

  let match = /^---\n([\s\S]*?)\n---/.exec(source)
  let frontmatter = (match ? yaml.load(match[1]) : {}) as Frontmatter
  let metadata = frontmatter.nextjs?.metadata ?? {}
  let title =
    typeof metadata.title === 'string' ? metadata.title : frontmatter.title
  let description = metadata.description ?? undefined

  // Social cards inherit wholesale from the root layout, so a page that only
  // sets `title` would still share the home page's card. Derive them here.
  let shared = {
    title: title ? `${title} - ${site.name}` : site.title,
    description: description ?? site.description,
  }

  return {
    ...metadata,
    title: title ?? undefined,
    openGraph: { ...shared, ...metadata.openGraph },
    twitter: { ...shared, ...metadata.twitter },
  }
}
