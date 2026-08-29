import { nodes as defaultNodes, Tag } from '@markdoc/markdoc'
import { slugifyWithCounter } from '@sindresorhus/slugify'
import yaml from 'js-yaml'

import { DocsLayout } from '@/components/DocsLayout'
import { Fence } from '@/components/Fence'

let documentSlugifyMap = new Map()

// Heading children arrive transformed, so inline code is a Tag rather than a
// string. Walk into it, otherwise a heading like `## \`passwordless:purge\``
// slugifies to nothing and its anchor stops matching the table of contents.
function collectText(children) {
  return children
    .map((child) => {
      if (typeof child === 'string') {
        return child
      }
      if (child && typeof child === 'object') {
        if (Array.isArray(child.children) && child.children.length > 0) {
          return collectText(child.children)
        }
        if (typeof child.attributes?.content === 'string') {
          return child.attributes.content
        }
      }
      return ''
    })
    .filter(Boolean)
    .join(' ')
}

const nodes = {
  document: {
    ...defaultNodes.document,
    render: DocsLayout,
    transform(node, config) {
      documentSlugifyMap.set(config, slugifyWithCounter())

      return new Tag(
        this.render,
        {
          frontmatter: yaml.load(node.attributes.frontmatter),
          nodes: node.children,
        },
        node.transformChildren(config),
      )
    },
  },
  heading: {
    ...defaultNodes.heading,
    transform(node, config) {
      let slugify = documentSlugifyMap.get(config)
      let attributes = node.transformAttributes(config)
      let children = node.transformChildren(config)
      let text = collectText(children)
      let id = attributes.id ?? slugify(text)

      return new Tag(
        `h${node.attributes.level}`,
        { ...attributes, id },
        children,
      )
    },
  },
  th: {
    ...defaultNodes.th,
    attributes: {
      ...defaultNodes.th.attributes,
      scope: {
        type: String,
        default: 'col',
      },
    },
  },
  fence: {
    render: Fence,
    attributes: {
      language: {
        type: String,
      },
    },
  },
}

export default nodes
