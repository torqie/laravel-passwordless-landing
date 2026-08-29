import { docsMetadata } from '@/lib/docs-metadata'

export const metadata = docsMetadata('custom-actions')

export default function DocsPageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
