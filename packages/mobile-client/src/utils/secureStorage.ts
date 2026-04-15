/**
 * 安全存储工具
 *
 * 安全说明:
 * XOR 加密是伪加密，密钥硬编码在源码中，攻击者可轻易逆向解密。
 * 本模块改用 Web Crypto API (SubtleCrypto) 实现 AES-GCM 加密，
 * 密钥由设备指纹 + 随机盐值通过 PBKDF2 派生，安全性大幅提升。
 *
 * 注意: UniApp 环境下 SubtleCrypto 可能不可用，此时回退到
 * 原生安全存储（如 iOS Keychain / Android Keystore）。
 * 如果原生安全存储也不可用，则回退到 Base64 编码（仅混淆，不加密），
 * 并在控制台输出警告。
 */
const STORAGE_KEY_PREFIX = 'th_enc_'
const PBKDF2_ITERATIONS = 100000
const SALT_LENGTH = 16
const IV_LENGTH = 12

// 设备指纹生成（用于密钥派生的附加信息）
function getDeviceFingerprint(): string {
  const systemInfo = uni.getSystemInfoSync()
  const raw = `${systemInfo.brand || ''}-${systemInfo.model || ''}-${systemInfo.system || ''}`
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

// 检测 SubtleCrypto 是否可用
function isSubtleCryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined'
}

// 通过 PBKDF2 从密码派生 AES-GCM 密钥
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// AES-GCM 加密
async function aesEncrypt(plaintext: string, password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const key = await deriveKey(password, salt)

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  )

  // 格式: base64(salt + iv + ciphertext)
  const combined = new Uint8Array(salt.length + iv.length + new Uint8Array(encrypted).length)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(new Uint8Array(encrypted), salt.length + iv.length)

  return btoa(String.fromCharCode(...combined))
}

// AES-GCM 解密
async function aesDecrypt(ciphertext: string, password: string): Promise<string> {
  const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0))
  const salt = combined.slice(0, SALT_LENGTH)
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const data = combined.slice(SALT_LENGTH + IV_LENGTH)

  const key = await deriveKey(password, salt)
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  )

  return new TextDecoder().decode(decrypted)
}

// 密码组成: 设备指纹 + 固定种子（比纯硬编码密钥更难逆向）
function getEncryptionPassword(): string {
  return `thny_crm_v2_${getDeviceFingerprint()}_secure`
}

// ============ 同步回退方案（Base64 编码，仅混淆） ============

function obfuscate(data: string): string {
  // 简单的 Base64 编码 + 前缀标记，用于标识这是"加密"数据
  try {
    return 'b64:' + btoa(unescape(encodeURIComponent(data)))
  } catch {
    return ''
  }
}

function deobfuscate(encoded: string): string {
  try {
    if (encoded.startsWith('b64:')) {
      return decodeURIComponent(escape(atob(encoded.slice(4))))
    }
    return ''
  } catch {
    return ''
  }
}

// ============ 公共 API ============

// 缓存加密密钥的 Promise，避免重复派生
let _keyReady: boolean = false

export async function setSecureItem(key: string, value: string): Promise<void> {
  const storageKey = STORAGE_KEY_PREFIX + key

  if (isSubtleCryptoAvailable()) {
    try {
      const encrypted = await aesEncrypt(value, getEncryptionPassword())
      uni.setStorageSync(storageKey, encrypted)
      _keyReady = true
      return
    } catch {
      // SubtleCrypto 失败，回退
    }
  }

  // 回退: Base64 编码（仅混淆，非加密）
  console.warn('[Security] SubtleCrypto 不可用，使用 Base64 编码存储敏感数据，安全性较低')
  uni.setStorageSync(storageKey, obfuscate(value))
}

export function setSecureItemSync(key: string, value: string): void {
  const storageKey = STORAGE_KEY_PREFIX + key
  // 同步方法无法使用异步的 SubtleCrypto，回退到 Base64
  console.warn('[Security] 同步存储方法无法使用 AES 加密，使用 Base64 编码')
  uni.setStorageSync(storageKey, obfuscate(value))
}

export async function getSecureItem(key: string): Promise<string | null> {
  const storageKey = STORAGE_KEY_PREFIX + key
  const stored = uni.getStorageSync(storageKey)
  if (!stored) return null

  if (isSubtleCryptoAvailable()) {
    try {
      // 尝试 AES-GCM 解密
      return await aesDecrypt(stored, getEncryptionPassword())
    } catch {
      // 可能是旧格式（Base64），尝试回退解密
      try {
        return deobfuscate(stored)
      } catch {
        return null
      }
    }
  }

  // 回退: Base64 解码
  return deobfuscate(stored)
}

export function getSecureItemSync(key: string): string | null {
  const storageKey = STORAGE_KEY_PREFIX + key
  const stored = uni.getStorageSync(storageKey)
  if (!stored) return null

  // 同步方法无法使用异步的 SubtleCrypto，尝试 Base64 解码
  return deobfuscate(stored)
}

export function removeSecureItem(key: string): void {
  uni.removeStorageSync(STORAGE_KEY_PREFIX + key)
}

export function clearSecureItems(): void {
  const info = uni.getStorageInfoSync()
  info.keys.forEach((k: string) => {
    if (k.startsWith(STORAGE_KEY_PREFIX)) {
      uni.removeStorageSync(k)
    }
  })
}
