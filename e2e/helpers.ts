import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

/** Demo modda herhangi bir bilgiyle giriş yapılır; her test temiz bir tarayıcı bağlamıyla başlar. */
export async function login(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Giriş yap', exact: true }).click()
  await expect(page.getByRole('banner').getByText('Harcama Paneli')).toBeVisible()
}

/** Üst çubuktaki butonla "İşlem ekle" formunu doldurup kaydeder. */
export async function addTransaction(
  page: Page,
  opts: { amount: string; note?: string; category?: string; type?: 'income' | 'expense' },
) {
  await page.getByRole('banner').getByRole('button', { name: 'İşlem ekle' }).click()
  const dialog = page.getByRole('dialog', { name: 'İşlem ekle' })
  if (opts.type === 'income') await dialog.getByText('Gelir', { exact: true }).click()
  await dialog.getByLabel('Tutar (₺)').fill(opts.amount)
  if (opts.category) await dialog.getByLabel('Kategori').selectOption(opts.category)
  if (opts.note) await dialog.getByLabel('Not').fill(opts.note)
  await dialog.getByRole('button', { name: 'İşlemi kaydet' }).click()
  await expect(dialog).toBeHidden()
}
