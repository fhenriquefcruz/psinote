import { expect, test } from '@playwright/test';
import {
  assertNoPageHorizontalOverflow,
  registerSyntheticUser
} from './helpers/auth.js';

test('core professional surfaces remain usable on small mobile widths', async ({ page }) => {
  await registerSyntheticUser(page);

  await assertNoPageHorizontalOverflow(page);
  await expect(
    page.getByRole('button', { name: 'Abrir busca e comandos' })
  ).toBeVisible();

  await page.goto('agenda');
  await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Novo agendamento' })
  ).toBeVisible();
  await assertNoPageHorizontalOverflow(page);

  await page.goto('documents');
  await expect(page.getByRole('heading', { name: 'Documentos', exact: true })).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Novo documento' })
  ).toBeVisible();
  await assertNoPageHorizontalOverflow(page);
});

test('command palette behaves as a mobile dialog', async ({ page }) => {
  await registerSyntheticUser(page);

  await page.getByRole('button', { name: 'Abrir busca e comandos' }).click();
  const dialog = page.getByRole('dialog', { name: 'Busca segura' });

  await expect(dialog).toBeVisible();
  await expect(page.getByLabel('Buscar no PsiNote')).toBeFocused();

  await page.getByLabel('Buscar no PsiNote').fill('paciente');
  await expect(
    page.getByRole('button', { name: /Novo paciente/i })
  ).toBeVisible();
});
