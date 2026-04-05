import { test, expect } from '@playwright/test'

test('桌面主页与导出弹窗路由可以完成基础渲染', async ({ page }) => {
  await page.goto('/#/home')
  await expect(page.locator('.workspaceShell')).toBeVisible()
  await expect(page.locator('.primaryAction')).toBeVisible()

  await page.goto('/#/export')
  await expect(page.locator('.exportDialog')).toBeVisible()
  await expect(page.locator('.dialogHeader')).toContainText('导出中心')
  await expect(page.locator('.dialogCloseBtn')).toHaveCount(0)
})
