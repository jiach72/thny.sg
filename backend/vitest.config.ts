import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            exclude: [
                'node_modules/**',
                'dist/**',
                'prisma/**',
                'scripts/**',
                'tests/**',
                '**/*.d.ts',
                '**/*.config.*',
                'src/routes/**',
                'src/repositories/**',
                'src/services/index.ts',
                'src/middlewares/index.ts',
                'src/config/database.ts',
                'src/config/metrics.ts',
                'src/config/swagger.ts',
            ],
            thresholds: {
                lines: 70,
                functions: 70,
                branches: 60,
                statements: 70,
            },
        },
    },
})
