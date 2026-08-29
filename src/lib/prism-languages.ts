import { Prism } from 'prism-react-renderer'

// prism-react-renderer bundles a vendored Prism that has no PHP grammar, and
// this is a PHP package's documentation. The prismjs grammars register
// themselves onto the global Prism, so hand them ours before loading any.
;(globalThis as unknown as { Prism: typeof Prism }).Prism = Prism

require('prismjs/components/prism-markup-templating')
require('prismjs/components/prism-php')
require('prismjs/components/prism-bash')
require('prismjs/components/prism-ini')
require('prismjs/components/prism-json')
require('prismjs/components/prism-diff')

// Aliases for the fence languages used across the docs.
Prism.languages.dotenv = Prism.languages.ini
Prism.languages.env = Prism.languages.ini
Prism.languages.blade = Prism.languages.markup
Prism.languages.vue = Prism.languages.markup
Prism.languages.svelte = Prism.languages.markup

export { Prism }
