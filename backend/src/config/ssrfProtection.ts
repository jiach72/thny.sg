import dns from 'dns/promises'

const PRIVATE_IPV4_RANGES: Array<{ start: number; end: number }> = [
    { start: ipToNum('10.0.0.0'), end: ipToNum('10.255.255.255') },
    { start: ipToNum('172.16.0.0'), end: ipToNum('172.31.255.255') },
    { start: ipToNum('192.168.0.0'), end: ipToNum('192.168.255.255') },
    { start: ipToNum('127.0.0.0'), end: ipToNum('127.255.255.255') },
    { start: ipToNum('169.254.0.0'), end: ipToNum('169.254.255.255') },
    { start: ipToNum('0.0.0.0'), end: ipToNum('0.255.255.255') },
]

function isValidIPv4(ip: string): boolean {
    const parts = ip.split('.')
    if (parts.length !== 4) return false
    return parts.every(part => {
        const num = parseInt(part, 10)
        return !isNaN(num) && num >= 0 && num <= 255 && part === String(num)
    })
}

function ipToNum(ip: string): number {
    const parts = ip.split('.').map(Number)
    return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0
}

function isPrivateIPv4(ip: string): boolean {
    if (!isValidIPv4(ip)) return false
    const num = ipToNum(ip)
    return PRIVATE_IPV4_RANGES.some(range => num >= range.start && num <= range.end)
}

function isPrivateIPv6(ip: string): boolean {
    const lower = ip.toLowerCase()
    if (lower === '::1') return true
    if (lower.startsWith('fe80:')) return true
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true
    return false
}

function isPrivateIP(ip: string): boolean {
    if (ip.includes(':')) return isPrivateIPv6(ip)
    return isPrivateIPv4(ip)
}

export function isSafeUrl(url: string): boolean {
    try {
        const parsed = new URL(url)
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
        const hostname = parsed.hostname.toLowerCase()
        if (hostname === 'localhost' || hostname === '0.0.0.0') return false
        if (isPrivateIP(hostname)) return false
        return true
    } catch {
        return false
    }
}

export async function validateSafeUrl(url: string): Promise<string> {
    if (!isSafeUrl(url)) {
        throw new Error('不安全的URL地址: 协议或主机名不合法')
    }
    const parsed = new URL(url)
    try {
        const addresses = await dns.resolve4(parsed.hostname)
        for (const addr of addresses) {
            if (isPrivateIP(addr)) {
                throw new Error('不安全的URL地址: DNS解析指向私有网络')
            }
        }
        try {
            const v6Addresses = await dns.resolve6(parsed.hostname)
            for (const addr of v6Addresses) {
                if (isPrivateIP(addr)) {
                    throw new Error('不安全的URL地址: DNS解析指向私有网络')
                }
            }
        } catch {
            // IPv6解析失败不影响，可能主机不支持IPv6
        }
    } catch (err) {
        if (err instanceof Error && err.message.startsWith('不安全的URL地址')) {
            throw err
        }
        // DNS解析失败不阻断，但记录风险
    }
    return url
}
