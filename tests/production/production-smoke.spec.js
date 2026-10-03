import { expect, test } from '@playwright/test';

test('public production shell loads without uncaught page errors', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  const response = await page.goto('.', {
    waitUntil: 'networkidle'
  });

  expect(response?.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/PsiNote/i);

  const emailInput = page.locator('input[type="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  await expect(emailInput).toBeVisible();
  await expect(passwordInput).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Entrar/i }).first()
  ).toBeVisible();

  expect(pageErrors).toEqual([]);
});
