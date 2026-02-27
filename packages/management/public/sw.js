/**
 * Service Worker — 通海南洋 CRM 管理后台
 * 基础缓存策略：缓存静态资源，网络优先 API 请求
 */

const CACHE_NAME = 'thny-crm-v1'
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
]

// 安装：预缓存核心静态资源
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS)
        })
    )
    // 立即激活，无需等待
    self.skipWaiting()
})

// 激活：清理旧版本缓存
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        })
    )
    // 立即接管所有客户端
    self.clients.claim()
})

// 请求拦截：网络优先策略（API 直连，静态资源缓存回退）
self.addEventListener('fetch', (event) => {
    const { request } = event
    const url = new URL(request.url)

    // API 请求直连，不缓存
    if (url.pathname.startsWith('/api/')) {
        return
    }

    // 静态资源：缓存优先，后台更新
    event.respondWith(
        caches.match(request).then((cached) => {
            const fetchPromise = fetch(request).then((response) => {
                // 仅缓存成功的 GET 请求
                if (response.ok && request.method === 'GET') {
                    const responseClone = response.clone()
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone)
                    })
                }
                return response
            }).catch(() => {
                // 网络失败时返回缓存（如果有的话）
                return cached
            })

            // 有缓存就先返回缓存，后台更新；无缓存等待网络
            return cached || fetchPromise
        })
    )
})
