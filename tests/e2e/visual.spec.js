import crypto from 'node:crypto';
import { expect, test } from '@playwright/test';
import { registerSyntheticUser } from './helpers/auth.js';
import { VISUAL_BASELINES } from './visual-baselines.js';

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

const expectReviewedVisual = async (
  locator,
  baselineHash,
  artifactName,
  testInfo
) => {
  const screenshot = await locator.screenshot(screenshotOptions);
  const actualHash = crypto
    .createHash('sha256')
    .update(screenshot)
    .digest('hex');

  await testInfo.attach(artifactName + '.png', {
    body: screenshot,
    contentType: 'image/png'
  });

  expect(
    actualHash,
    artifactName
      + ' changed from the reviewed Linux visual baseline. '
      + 'Inspect the attached PNG before updating the baseline hash.'
  ).toBe(baselineHash);
};

test('login shell visual baseline', async ({ page }, testInfo) => {
  await stabilizeVisualEnvironment(page);
  await page.goto('login');

  await expect(
    page.getByRole('heading', { name: 'Entrar no PsiNote' })
  ).toBeVisible();

  await expectReviewedVisual(
    page.locator('#root'),
    VISUAL_BASELINES.loginShell,
    'login-shell',
    testInfo
  );
});

test('daily command center visual baseline', async ({ page }, testInfo) => {
  await stabilizeVisualEnvironment(page);
  await registerSyntheticUser(page);

  const toast = page.locator('.Toastify__toast').first();
  if (await toast.count()) {
    await toast.waitFor({ state: 'detached', timeout: 7_000 }).catch(() => {});
  }

  await expect(
    page.getByRole('heading', { name: /Bom dia|Visão do dia/i })
  ).toBeVisible();

  await expectReviewedVisual(
    page.locator('main.page-shell'),
    VISUAL_BASELINES.dashboardCommandCenter,
    'dashboard-command-center',
    testInfo
  );
});

test('documents center visual baseline', async ({ page }, testInfo) => {
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

  await expectReviewedVisual(
    page.locator('main.page-shell'),
    VISUAL_BASELINES.documentsCenter,
    'documents-center',
    testInfo
  );
});
