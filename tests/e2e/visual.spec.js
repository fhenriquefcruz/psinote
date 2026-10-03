import { expect, test } from '@playwright/test';
import { registerSyntheticUser } from './helpers/auth.js';

const stabilizeVisualEnvironment = async (page) => {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
  await page.emulateMedia({
    colorScheme: 'light',
    reducedMotion: 'reduce'
  });
};

const screenshotOptions = {
  animations: 'disabled',
  caret: 'hide',
  scale: 'css'
};

test('login shell visual baseline', async ({ page }) => {
  await stabilizeVisualEnvironment(page);
  await page.goto('login');

  await expect(
    page.getByRole('heading', { name: 'Entrar no PsiNote' })
  ).toBeVisible();

  await expect(page.locator('#root')).toHaveScreenshot(
    'login-shell.png',
    screenshotOptions
  );
});

test('daily command center visual baseline', async ({ page }) => {
  await stabilizeVisualEnvironment(page);
  await registerSyntheticUser(page);

  const toast = page.locator('.Toastify__toast').first();
  if (await toast.count()) {
    await toast.waitFor({ state: 'detached', timeout: 7_000 }).catch(() => {});
  }

  await expect(
    page.getByRole('heading', { name: /Bom dia|Visão do dia/i })
  ).toBeVisible();

  await expect(page.locator('main.page-shell')).toHaveScreenshot(
    'dashboard-command-center.png',
    screenshotOptions
  );
});

test('documents center visual baseline', async ({ page }) => {
  await stabilizeVisualEnvironment(page);
  await registerSyntheticUser(page);

  const toast = page.locator('.Toastify__toast').first();
  if (await toast.count()) {
    await toast.waitFor({ state: 'detached', timeout: 7_000 }).catch(() => {});
  }

  await page.goto('documents');

  await expect(
    page.getByRole('heading', { name: 'Documentos', exact: true })
  ).toBeVisible();

  await expect(page.locator('main.page-shell')).toHaveScreenshot(
    'documents-center.png',
    screenshotOptions
  );
});
