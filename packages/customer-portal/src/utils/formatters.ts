/**
 * Shared formatting utilities for the Customer Portal.
 * Violations of DRY (Don't Repeat Yourself) were found in components,
 * so these have been extracted to a central location.
 */

export function formatDate(dateStr: string | Date | null | undefined, includeTime = false): string {
    if (!dateStr) return '-'

    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }

    if (includeTime) {
        options.hour = '2-digit'
        options.minute = '2-digit'
    }

    return new Date(dateStr).toLocaleDateString('zh-CN', options)
}

export function getStatusLabel(status: string): string {
    const map: Record<string, string> = {
        PLANNING: '规划中',
        ACTIVE: '进行中',
        ON_HOLD: '暂停',
        COMPLETED: '已完成',
        ARCHIVED: '已归档'
    }
    return map[status] || status
}

export function getStatusClass(status: string): string {
    const map: Record<string, string> = {
        ACTIVE: 'bg-green-500/10 text-green-400',
        COMPLETED: 'bg-blue-500/10 text-blue-400',
        ON_HOLD: 'bg-amber-500/10 text-amber-400'
    }
    return map[status] || 'bg-white/5 text-text-muted'
}

export function formatFileSize(bytes: number): string {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
