import clsx from 'clsx'

function LogomarkPaths() {
  return (
    <g
      fill="none"
      stroke="#38BDF8"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={3}
    >
      <circle cx="11.5" cy="18" r="6.5" />
      <path d="M18 18h14" />
      <path d="M26.5 18v5.5" />
      <path d="M31 18v4" />
    </g>
  )
}

export function Logomark(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 36 36" fill="none" {...props}>
      <LogomarkPaths />
    </svg>
  )
}

/**
 * Wordmark. The template shipped its wordmark as traced SVG paths; rendering
 * real text instead keeps Lexend's `ss01` feature and a sane fallback stack,
 * so this takes text colour classes rather than `fill-*`.
 */
export function Logo({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div className={clsx('flex items-center gap-2.5', className)} {...props}>
      <Logomark className="h-9 w-9 flex-none" />
      <span className="font-display text-xl font-semibold tracking-tight whitespace-nowrap">
        Laravel Passwordless
      </span>
    </div>
  )
}
