'use client'

import { Fragment } from 'react'
import { Highlight } from 'prism-react-renderer'

import { Prism } from '@/lib/prism-languages'

export function Fence({
  children,
  language,
}: {
  children: string
  language: string
}) {
  // Unknown fences render as plain text rather than blowing up the page.
  let resolved = Prism.languages[language] ? language : 'plain'

  return (
    <Highlight
      code={children.trimEnd()}
      language={resolved}
      theme={{ plain: {}, styles: [] }}
    >
      {({ className, style, tokens, getTokenProps }) => (
        <pre className={className} style={style}>
          <code>
            {tokens.map((line, lineIndex) => (
              <Fragment key={lineIndex}>
                {line
                  .filter((token) => !token.empty)
                  .map((token, tokenIndex) => (
                    <span key={tokenIndex} {...getTokenProps({ token })} />
                  ))}
                {'\n'}
              </Fragment>
            ))}
          </code>
        </pre>
      )}
    </Highlight>
  )
}
