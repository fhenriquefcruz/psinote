import { expect } from '@playwright/test';

const uniqueToken = () =>
  Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);

export const syntheticAccount = (label = 'quality') => ({
  name: 'Profissional Teste',
  email: label + '-' + uniqueToken() + '@example.test',
  password: 'Quality-Only-123!'
});

export const registerSyntheticUser = async (
  page,
  account = syntheticAccount()
) => {
  await page.goto('register');

  await page.getByLabel('Nome completo').fill(account.name);
  await page.getByLabel('E-mail').fill(account.email);
  await page.getByLabel('Senha').fill(account.password);
  await page.getByRole('button', { name: 'Cadastrar' }).click();

  await expect(page).toHaveURL(/\/psinote\/dashboard$/);
  return account;
};

export const assertNoPageHorizontalOverflow = async (page) => {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth
  }));

  expect(
    metrics.scrollWidth,
    'The page shell must not overflow the viewport horizontally.'
  ).toBeLessThanOrEqual(metrics.viewportWidth + 1);
};
