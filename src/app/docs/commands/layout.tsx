import { docsMetadata } from '@/lib/docs-metadata'

export const metadata = docsMetadata('commands')

export default function DocsPageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
