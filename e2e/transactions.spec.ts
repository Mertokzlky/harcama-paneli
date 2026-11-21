import { expect, test } from '@playwright/test'
import { addTransaction, login } from './helpers.ts'

test.beforeEach(async ({ page }) => {
  await login(page)
})

test('geçersiz tutar kaydedilmez ve hata gösterilir', async ({ page }) => {
  await page.getByRole('banner').getByRole('button', { name: 'İşlem ekle' }).click()
  const dialog = page.getByRole('dialog', { name: 'İşlem ekle' })
  await dialog.getByLabel('Tutar (₺)').fill('abc')
  await dialog.getByRole('button', { name: 'İşlemi kaydet' }).click()

  await expect(dialog.getByText('Geçerli bir tutar gir')).toBeVisible()
  await expect(dialog).toBeVisible()
})

test('işlem eklenir, düzenlenir ve yenilemeden sonra da durur', async ({ page }) => {
  await addTransaction(page, { amount: '249,90', note: 'E2E kahve' })
  await expect(page.getByText('İşlem eklendi.')).toBeVisible()

  const row = page.getByRole('listitem').filter({ hasText: 'E2E kahve' })
  await expect(row).toContainText('249,90')

  await row.getByRole('button', { name: 'Düzenle: E2E kahve' }).click()
  const dialog = page.getByRole('dialog', { name: 'İşlemi düzenle' })
  await dialog.getByLabel('Not').fill('E2E çay')
  await dialog.getByRole('button', { name: 'Değişiklikleri kaydet' }).click()

  await expect(page.getByRole('listitem').filter({ hasText: 'E2E çay' })).toBeVisible()
  await expect(page.getByRole('listitem').filter({ hasText: 'E2E kahve' })).toHaveCount(0)

  await page.reload()
  await expect(page.getByRole('listitem').filter({ hasText: 'E2E çay' })).toBeVisible()
})

test('silinen işlem "Geri al" ile geri gelir', async ({ page }) => {
  await addTransaction(page, { amount: '75', note: 'E2E simit' })
  const row = page.getByRole('listitem').filter({ hasText: 'E2E simit' })
  await expect(row).toBeVisible()

  await row.getByRole('button', { name: 'Sil: E2E simit' }).click()
  await expect(page.getByText('İşlem silindi.')).toBeVisible()
  await expect(row).toHaveCount(0)

  await page.getByRole('button', { name: 'Geri al' }).click()
  await expect(page.getByText('İşlem geri alındı.')).toBeVisible()
  await expect(row).toBeVisible()
})

test('not alanına göre arama listeyi daraltır', async ({ page }) => {
  await addTransaction(page, { amount: '10', note: 'E2E benzersiz-kayit' })
  await page.getByRole('searchbox').fill('benzersiz-kayit')

  const items = page.getByRole('listitem').filter({ hasText: 'benzersiz-kayit' })
  await expect(items).toHaveCount(1)
  await expect(page.getByRole('listitem').filter({ hasText: 'Aylık burs' })).toHaveCount(0)
})
