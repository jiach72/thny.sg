import DOMPurify from 'dompurify'

const DEFAULT_ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'br', 'p', 'ul', 'ol', 'li', 'span', 'a', 'mark', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'blockquote', 'pre', 'code']
const DEFAULT_ALLOWED_ATTR = ['href', 'target', 'rel', 'class', 'style']

export function sanitizeHtml(dirty: string, options?: {
  allowedTags?: string[]
  allowedAttr?: string[]
}): string {
  if (!dirty) return ''
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: options?.allowedTags ?? DEFAULT_ALLOWED_TAGS,
    ALLOWED_ATTR: options?.allowedAttr ?? DEFAULT_ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  })
}

export function sanitizeText(dirty: string): string {
  if (!dirty) return ''
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['br', 'b', 'i', 'em', 'strong', 'a', 'mark'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })
}

export function sanitizeRichContent(dirty: string): string {
  if (!dirty) return ''
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: DEFAULT_ALLOWED_TAGS,
    ALLOWED_ATTR: DEFAULT_ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ADD_TAGS: ['img', 'hr', 'sub', 'sup'],
    ADD_ATTR: ['src', 'alt', 'width', 'height'],
  })
}
