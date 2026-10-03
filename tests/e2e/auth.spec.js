import { expect, test } from '@playwright/test';
import {
  registerSyntheticUser,
  syntheticAccount
} from './helpers/auth.js';

test('private route redirects unauthenticated browser to login', async ({ page }) => {
  await page.goto('dashboard');

  await expect(page).toHaveURL(/\/psinote\/login$/);
  await expect(
    page.getByRole('heading', { name: 'Entrar no PsiNote' })
  ).toBeVisible();
});

test('user can register, logout and login again against emulators', async ({ page }) => {
  const account = syntheticAccount('auth');
  await registerSyntheticUser(page, account);

  await expect(
    page.getByRole('heading', { name: /Visão do dia|Dashboard/i })
  ).toBeVisible();

  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page).toHaveURL(/\/psinote\/login$/);

  await page.getByLabel('E-mail').fill(account.email);
  await page.getByLabel('Senha').fill(account.password);
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page).toHaveURL(/\/psinote\/dashboard$/);
});

test('registered account can request password reset without real email delivery', async ({ page }) => {
  const account = syntheticAccount('reset');
  await registerSyntheticUser(page, account);

  await page.getByRole('button', { name: 'Sair' }).click();
  await page.getByRole('link', { name: 'Esqueci a senha' }).click();

  await expect(
    page.getByRole('heading', { name: 'Recuperar acesso' })
  ).toBeVisible();

  await page.getByLabel('E-mail').fill(account.email);
  await page.getByRole('button', { name: 'Recuperar senha' }).click();

  await expect(
    page.getByText(/Solicitação enviada/i)
  ).toBeVisible();
});
