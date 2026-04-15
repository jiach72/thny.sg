import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        host: '0.0.0.0',
        port: 3002,
        // SEC-01 缓解: esbuild CVE-2024-34342 仅影响 dev server，生产构建不受影响
        // 生产环境不暴露 dev server，如需内网开发请改为 host: 'localhost'
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
            },
        },
    },
    // PERF-01: Customer Portal 添加 manualChunks 分包策略
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'vue-vendor': ['vue', 'vue-router', 'pinia'],
                    'element-plus': ['element-plus'],
                    'utils': ['axios', 'dayjs'],
                },
            },
        },
    },
})
