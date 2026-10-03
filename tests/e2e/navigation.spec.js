import { expect, test } from '@playwright/test';
import { registerSyntheticUser } from './helpers/auth.js';

test.beforeEach(async ({ page }, testInfo) => {
  await registerSyntheticUser(page, undefined, testInfo);
});

test('ordinary user cannot open administration route', async ({ page }) => {
  await page.goto('admin');

  await expect(page).toHaveURL(/\/psinote\/dashboard$/);
  await expect(
    page.getByRole('link', { name: 'Administração' })
  ).toHaveCount(0);
});

test('command palette opens by keyboard and navigates to agenda', async ({ page }) => {
  await expect(
    page.getByRole('button', { name: 'Abrir busca e comandos' })
  ).toBeVisible();

  await page.keyboard.press('Control+K');

  await expect(
    page.getByRole('dialog', { name: 'Busca segura' })
  ).toBeVisible();

  await page.getByLabel('Buscar no PsiNote').fill('agenda');
  await page.getByRole('button', { name: /Abrir agenda/i }).click();

  await expect(page).toHaveURL(/\/psinote\/agenda$/);
  await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible();
});

test('command palette discloses that clinical narrative is not searched', async ({ page }) => {
  await page.getByRole('button', { name: 'Abrir busca e comandos' }).click();

  await expect(
    page.getByText(/conteúdo clínico de sessões não é pesquisado/i)
  ).toBeVisible();
});
