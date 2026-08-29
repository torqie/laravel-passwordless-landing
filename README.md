# Laravel Passwordless — documentation site

Landing page and documentation for [torqie/laravel-passwordless](https://github.com/torqie/laravel-passwordless).

Built on the [Tailwind Plus **Syntax**](https://tailwindcss.com/plus/templates/syntax) template — Next.js, Tailwind CSS, and Markdoc, with FlexSearch for the search index.

## Running it

```bash
npm install
npm run dev
```

Then open [http://localhost:3100](http://localhost:3100).

```bash
npm run build   # production build
npm run lint    # eslint
```

## Where things live

| Path | What |
| ---- | ---- |
| `src/app/page.md` | The landing page body (the hero above it is a component) |
| `src/app/docs/*/page.md` | One directory per documentation page |
| `src/lib/navigation.ts` | Sidebar structure — **add new pages here** |
| `src/components/Hero.tsx` | Hero copy, buttons, and the code sample |
| `src/lib/prism-languages.ts` | Registers PHP, Bash, INI, JSON and diff grammars |

Adding a page means creating `src/app/docs/<slug>/page.md` with `title` frontmatter and adding it to `navigation.ts`. Markdoc tags available in pages: `{% callout %}`, `{% quick-links %}` / `{% quick-link %}`, and `{% figure %}`.

## Licence

The Syntax template is commercial software from Tailwind Labs, used here under the
Tailwind Plus licence — see [LICENSE.md](./LICENSE.md).
