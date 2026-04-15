import promClient from 'prom-client'

const collectDefaultMetrics = promClient.collectDefaultMetrics
const Registry = promClient.Registry

// 创建独立的 Registry，避免与其他库的默认指标冲突
const register = new Registry()
collectDefaultMetrics({ register, prefix: 'crm_' })

// HTTP 请求总数计数器
const httpRequestsTotal = new promClient.Counter({
    name: 'crm_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register],
})

// HTTP 请求延迟直方图
const httpRequestDurationSeconds = new promClient.Histogram({
    name: 'crm_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
    registers: [register],
})

export { register, httpRequestsTotal, httpRequestDurationSeconds }
