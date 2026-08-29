import { ImageResponse } from 'next/og'

import { site } from '@/lib/site'

export const alt = site.title
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: '#0F172A',
          backgroundImage:
            'radial-gradient(circle at 78% 22%, rgba(56,189,248,0.22), transparent 55%)',
          padding: '80px 90px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <svg width="72" height="72" viewBox="0 0 36 36" fill="none">
            <g
              stroke="#38BDF8"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11.5" cy="18" r="6.5" />
              <path d="M18 18h14" />
              <path d="M26.5 18v5.5" />
              <path d="M31 18v4" />
            </g>
          </svg>
          <div style={{ fontSize: 40, color: '#E2E8F0', letterSpacing: -0.5 }}>
            {site.name}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 56,
            fontSize: 76,
            lineHeight: 1.1,
            color: '#F8FAFC',
            letterSpacing: -2,
          }}
        >
          No passwords. Just a link or a code.
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 36,
            fontSize: 34,
            lineHeight: 1.4,
            color: '#94A3B8',
          }}
        >
          Magic link and one-time code authentication for Laravel.
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 56,
            fontSize: 28,
            color: '#38BDF8',
          }}
        >
          composer require torqie/laravel-passwordless
        </div>
      </div>
    ),
    size,
  )
}
