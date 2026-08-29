import { docsMetadata } from '@/lib/docs-metadata'

export const metadata = docsMetadata('passwordless-sign-up')

export default function DocsPageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
