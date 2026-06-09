import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: process.env.E2E_BASE_URL || 'http://localhost:3001',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'management',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'portal',
            use: {
                ...devices['Desktop Chrome'],
                baseURL: process.env.E2E_PORTAL_URL || 'http://localhost:3002',
            },
        },
    ],
    webServer: {
        command: 'npm run dev:backend',
        url: 'http://localhost:4000/api/v1/health',
        reuseExistingServer: !process.env.CI,
        timeout: 30000,
    },
})
