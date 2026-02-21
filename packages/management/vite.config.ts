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
    build: {
        rollupOptions: {
            output: {
                // 拆分大依赖为独立 chunk，改善缓存和首次加载
                manualChunks: {
                    'vue-vendor': ['vue', 'vue-router', 'pinia'],
                    'element-plus': ['element-plus', '@element-plus/icons-vue'],
                    'echarts': ['echarts/core', 'echarts/charts', 'echarts/components', 'echarts/renderers'],
                },
            },
        },
    },
    server: {
        host: '0.0.0.0',
        port: 3001,
        proxy: {
            '/api': {
                target: 'http://localhost:4000',
                changeOrigin: true,
            },
        },
    },
})
