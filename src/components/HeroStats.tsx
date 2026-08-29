import clsx from 'clsx'

import { site } from '@/lib/site'
import { type ProjectStats } from '@/lib/stats'

function formatCount(value: number) {
  if (value < 1000) {
    return value.toLocaleString('en-US')
  }

  if (value < 1_000_000) {
    return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0)}k`.replace(
      '.0k',
      'k',
    )
  }

  return `${(value / 1_000_000).toFixed(1)}M`.replace('.0M', 'M')
}

type Stat = {
  label: string
  value: string
  href: string
  dot?: 'good' | 'bad'
}

export function HeroStats({ stats }: { stats: ProjectStats }) {
  let items: Array<Stat> = []

  if (stats.version) {
    items.push({
      label: 'Latest',
      value: stats.version,
      href: `https://packagist.org/packages/${site.package}`,
    })
  }

  if (stats.downloads !== null) {
    items.push({
      label: 'Installs',
      value: formatCount(stats.downloads),
      href: `https://packagist.org/packages/${site.package}/stats`,
    })
  }

  if (stats.testsPassing !== null) {
    items.push({
      label: 'Tests',
      value: stats.testsPassing ? 'passing' : 'failing',
      dot: stats.testsPassing ? 'good' : 'bad',
      href: `${site.repository}/actions/workflows/${site.testsWorkflow}`,
    })
  }

  // Every stat is fetched, so an offline build simply renders nothing here.
  if (items.length === 0) {
    return null
  }

  return (
    <dl className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 md:justify-center lg:justify-start">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1">
          <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
            {item.label}
          </dt>
          <dd>
            <a
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-2 font-mono text-sm text-slate-300 transition hover:text-white"
            >
              {item.dot && (
                <span
                  className={clsx(
                    'h-1.5 w-1.5 flex-none rounded-full',
                    item.dot === 'good' ? 'bg-emerald-400' : 'bg-rose-400',
                  )}
                />
              )}
              {item.value}
            </a>
          </dd>
        </div>
      ))}
    </dl>
  )
}
