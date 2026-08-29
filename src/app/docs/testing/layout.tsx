import { docsMetadata } from '@/lib/docs-metadata'

export const metadata = docsMetadata('testing')

export default function DocsPageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
