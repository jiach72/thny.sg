import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
    test('should show login page', async ({ page }) => {
        await page.goto('/login')
        await expect(page.locator('input[type="email"]')).toBeVisible()
        await expect(page.locator('input[type="password"]')).toBeVisible()
    })

    test('should show validation errors on empty submit', async ({ page }) => {
        await page.goto('/login')
        await page.click('button[type="submit"]')
        await expect(page.locator('.el-form-item__error, .error-message')).toBeVisible()
    })

    test('should show error on invalid credentials', async ({ page }) => {
        await page.goto('/login')
        await page.fill('input[type="email"]', 'invalid@test.com')
        await page.fill('input[type="password"]', 'wrongpassword')
        await page.click('button[type="submit"]')
        await expect(page.locator('.el-message--error, .error-toast')).toBeVisible({ timeout: 5000 })
    })
})
