import { docsMetadata } from '@/lib/docs-metadata'

export const metadata = docsMetadata('fluent-api')

export default function DocsPageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
