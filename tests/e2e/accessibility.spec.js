import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { registerSyntheticUser } from './helpers/auth.js';

const assertA11y = async (page) => {
  const results = await new AxeBuilder({ page })
    .withTags([
      'wcag2a',
      'wcag2aa',
      'wcag21a',
      'wcag21aa',
      'wcag22aa'
    ])
    .analyze();

  if (results.violations.length) {
    console.error(
      'A11Y_VIOLATIONS',
      JSON.stringify(
        results.violations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          help: violation.help,
          targets: violation.nodes.map((node) => node.target)
        })),
        null,
        2
      )
    );
  }

  expect(results.violations).toEqual([]);
};

test('login has no automated WCAG A/AA violations', async ({ page }) => {
  await page.goto('login');
  await expect(
    page.getByRole('heading', { name: 'Entrar no PsiNote' })
  ).toBeVisible();

  await assertA11y(page);
});

test('dashboard has no automated WCAG A/AA violations', async ({ page }) => {
  await registerSyntheticUser(page);
  await assertA11y(page);
});

test('agenda has no automated WCAG A/AA violations', async ({ page }) => {
  await registerSyntheticUser(page);
  await page.goto('agenda');
  await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible();

  await assertA11y(page);
});

test('documents center has no automated WCAG A/AA violations', async ({ page }) => {
  await registerSyntheticUser(page);
  await page.goto('documents');
  await expect(page.getByRole('heading', { name: 'Documentos' })).toBeVisible();

  await assertA11y(page);
});
