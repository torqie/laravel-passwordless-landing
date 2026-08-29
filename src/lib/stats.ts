import { site } from '@/lib/site'

export type ProjectStats = {
  downloads: number | null
  version: string | null
  testsPassing: boolean | null
}

export const EMPTY_STATS: ProjectStats = {
  downloads: null,
  version: null,
  testsPassing: null,
}

// These are decoration, not content. Any failure — network, rate limit, a
// shape change upstream — must degrade to hiding the stat, never break a build.
async function getJson(url: string): Promise<any> {
  try {
    let response = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': site.url },
      next: { revalidate: 3600 },
    })

    return response.ok ? await response.json() : null
  } catch {
    return null
  }
}

/**
 * Sort rather than trusting order. The p2 feed happens to list newest first,
 * but nothing documents that.
 */
function latestStableVersion(versions: Array<string>): string | null {
  let [latest] = versions
    .filter((version) => /^v?\d+\.\d+\.\d+$/.test(version))
    .map((version) => ({
      raw: version,
      parts: version.replace(/^v/, '').split('.').map(Number),
    }))
    .sort(
      (a, b) =>
        b.parts[0] - a.parts[0] ||
        b.parts[1] - a.parts[1] ||
        b.parts[2] - a.parts[2],
    )

  return latest?.raw ?? null
}

export async function getProjectStats(): Promise<ProjectStats> {
  let [packagist, metadata, testRuns] = await Promise.all([
    // Download counts only exist on the web endpoint...
    getJson(`https://packagist.org/packages/${site.package}.json`),
    // ...but that endpoint has served a version list missing the newest
    // release. p2 is the canonical feed Composer itself resolves against.
    getJson(`https://repo.packagist.org/p2/${site.package}.json`),
    getJson(
      `https://api.github.com/repos/${site.package}/actions/workflows/${site.testsWorkflow}/runs?branch=main&per_page=1&status=completed`,
    ),
  ])

  let latestRun = testRuns?.workflow_runs?.[0]
  let downloads = packagist?.package?.downloads?.total
  let released: Array<string> = (
    metadata?.packages?.[site.package] ?? []
  ).flatMap((release: { version?: unknown }) =>
    typeof release.version === 'string' ? [release.version] : [],
  )

  return {
    downloads: typeof downloads === 'number' ? downloads : null,
    version: latestStableVersion(released),
    testsPassing: latestRun ? latestRun.conclusion === 'success' : null,
  }
}
