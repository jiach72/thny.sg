import { describe, it, expect } from 'vitest'
import { sanitizeHtml, sanitizeText, sanitizeRichContent } from './sanitize'

describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
        const result = sanitizeHtml('<script>alert("xss")</script><p>Hello</p>')
        expect(result).not.toContain('<script')
        expect(result).toContain('<p>Hello</p>')
    })

    it('should remove onerror attributes', () => {
        const result = sanitizeHtml('<img src="x" onerror="alert(1)">')
        expect(result).not.toContain('onerror')
    })

    it('should preserve safe HTML', () => {
        const result = sanitizeHtml('<p>Hello <strong>World</strong></p>')
        expect(result).toContain('<p>')
        expect(result).toContain('<strong>')
    })

    it('should handle empty input', () => {
        const result = sanitizeHtml('')
        expect(result).toBe('')
    })

    it('should remove iframe tags', () => {
        const result = sanitizeHtml('<iframe src="evil.com"></iframe>')
        expect(result).not.toContain('<iframe')
    })

    it('should remove event handler attributes', () => {
        const result = sanitizeHtml('<p onclick="alert(1)">Click me</p>')
        expect(result).not.toContain('onclick')
    })

    it('should preserve allowed attributes', () => {
        const result = sanitizeHtml('<a href="https://example.com" target="_blank" rel="noopener">Link</a>')
        expect(result).toContain('href="https://example.com"')
        expect(result).toContain('target="_blank"')
    })
})

describe('sanitizeText', () => {
    it('should strip most tags but keep inline formatting', () => {
        const result = sanitizeText('<p>Hello</p> <strong>World</strong>')
        expect(result).toContain('<strong>World</strong>')
    })

    it('should remove div tags', () => {
        const result = sanitizeText('<div>content</div>')
        expect(result).not.toContain('<div')
    })

    it('should handle empty input', () => {
        const result = sanitizeText('')
        expect(result).toBe('')
    })
})

describe('sanitizeRichContent', () => {
    it('should allow img tags with src and alt', () => {
        const result = sanitizeRichContent('<img src="image.png" alt="desc">')
        expect(result).toContain('src="image.png"')
        expect(result).toContain('alt="desc"')
    })

    it('should allow hr tags', () => {
        const result = sanitizeRichContent('<hr>')
        expect(result).toContain('<hr')
    })

    it('should remove script tags', () => {
        const result = sanitizeRichContent('<script>alert(1)</script><p>Safe</p>')
        expect(result).not.toContain('<script')
        expect(result).toContain('<p>Safe</p>')
    })

    it('should handle empty input', () => {
        const result = sanitizeRichContent('')
        expect(result).toBe('')
    })
})
