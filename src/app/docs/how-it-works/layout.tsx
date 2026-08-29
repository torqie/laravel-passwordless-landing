import { docsMetadata } from '@/lib/docs-metadata'

export const metadata = docsMetadata('how-it-works')

export default function DocsPageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
