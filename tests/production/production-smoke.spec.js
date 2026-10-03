import { expect, test } from '@playwright/test';

test('public production shell loads without uncaught page errors', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  const response = await page.goto('.', {
    waitUntil: 'networkidle'
  });

  expect(response?.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/PsiNote/i);
  await expect(
    page.getByRole('heading', { name: /Entrar no PsiNote|Criar conta|Recuperar acesso/i })
  ).toBeVisible();

  expect(pageErrors).toEqual([]);
});
