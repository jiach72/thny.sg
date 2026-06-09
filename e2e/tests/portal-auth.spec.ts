import { test, expect } from '@playwright/test'

test.describe('Portal Authentication', () => {
    test('should show portal login page', async ({ page }) => {
        await page.goto('/login')
        await expect(page.locator('input[type="email"]')).toBeVisible()
    })

    test('should navigate to forgot password', async ({ page }) => {
        await page.goto('/login')
        const forgotLink = page.locator('a', { hasText: /forgot|忘记/ })
        if (await forgotLink.isVisible()) {
            await forgotLink.click()
            await expect(page).toHaveURL(/forgot-password/)
        }
    })
})
