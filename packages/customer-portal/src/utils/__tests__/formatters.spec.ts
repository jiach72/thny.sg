import { describe, it, expect } from 'vitest'
import { formatDate, getStatusLabel, formatFileSize, getStatusClass } from '../formatters'

describe('formatters', () => {
    describe('formatDate', () => {
        it('returns "-" for null or empty dates', () => {
            expect(formatDate(null)).toBe('-')
            expect(formatDate('')).toBe('-')
        })

        it('formats a valid date correctly without time', () => {
            // 2026-02-27T00:00:00.000Z local time format
            const date = new Date('2026-02-27T10:00:00.000Z')
            const formatted = formatDate(date)
            expect(formatted).toContain('2026年')
            expect(formatted).toContain('2月')
            expect(formatted).toContain('27日')
        })
    })

    describe('getStatusLabel', () => {
        it('translates known English status to Chinese', () => {
            expect(getStatusLabel('PLANNING')).toBe('规划中')
            expect(getStatusLabel('ACTIVE')).toBe('进行中')
            expect(getStatusLabel('COMPLETED')).toBe('已完成')
        })

        it('returns original status if unknown', () => {
            expect(getStatusLabel('UNKNOWN_STATUS')).toBe('UNKNOWN_STATUS')
        })
    })

    describe('getStatusClass', () => {
        it('returns tailwind classes for active status', () => {
            expect(getStatusClass('ACTIVE')).toBe('bg-green-500/10 text-green-400')
        })

        it('returns muted classes for unknown status', () => {
            expect(getStatusClass('UNKNOWN')).toBe('bg-white/5 text-text-muted')
        })
    })

    describe('formatFileSize', () => {
        it('formats bytes correctly', () => {
            expect(formatFileSize(0)).toBe('0 B')
            expect(formatFileSize(1024)).toBe('1 KB')
            expect(formatFileSize(1024 * 1024)).toBe('1 MB')
            expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
        })
    })
})
