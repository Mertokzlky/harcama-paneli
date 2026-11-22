import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { login } from './helpers.ts'

test.beforeEach(async ({ page }) => {
  await login(page)
})

const csv = (lines: string[]) => ({
  name: 'e2e.csv',
  mimeType: 'text/csv',
  buffer: Buffer.from(['Tarih;Tür;Kategori;Tutar;Not', ...lines].join('\r\n'), 'utf-8'),
})

test('yeni satır içe aktarılır, aynı dosya ikinci kez eklenmez', async ({ page }) => {
  const file = csv(['2026-01-15;Gider;Market;123,45;E2E csv yeni'])

  await page.locator('input[type=file]').setInputFiles(file)
  const dialog = page.getByRole('dialog', { name: 'CSV içe aktarma' })
  await expect(dialog).toContainText('1 yeni işlem')
  await dialog.getByRole('button', { name: '1 işlemi içe aktar' }).click()
  await expect(page.getByText('1 işlem içe aktarıldı.')).toBeVisible()

  await page.getByRole('searchbox').fill('E2E csv yeni')
  await expect(page.getByRole('listitem').filter({ hasText: 'E2E csv yeni' })).toHaveCount(1)

  // Aynı dosya tekrar: hiçbir şey eklenmemeli.
  await page.locator('input[type=file]').setInputFiles(file)
  await expect(dialog).toContainText('0 yeni işlem')
  await expect(dialog).toContainText('1 zaten kayıtlı')
  await expect(dialog.getByRole('button', { name: '0 işlemi içe aktar' })).toBeDisabled()
})

test('tekrar eden satırlar isteğe bağlı olarak yine de eklenebilir', async ({ page }) => {
  const file = csv(['2026-01-16;Gider;Market;55;E2E csv cift'])
  const input = page.locator('input[type=file]')
  const dialog = page.getByRole('dialog', { name: 'CSV içe aktarma' })

  await input.setInputFiles(file)
  await dialog.getByRole('button', { name: '1 işlemi içe aktar' }).click()
  await expect(dialog).toBeHidden()

  await input.setInputFiles(file)
  await expect(dialog).toContainText('0 yeni işlem')
  await dialog.getByLabel('Zaten kayıtlı olanları da yine de ekle').check()
  await dialog.getByRole('button', { name: '1 işlemi içe aktar' }).click()
  await expect(dialog).toBeHidden()

  await page.getByRole('searchbox').fill('E2E csv cift')
  await expect(page.getByRole('listitem').filter({ hasText: 'E2E csv cift' })).toHaveCount(2)
})

test('kendi dışa aktarımını geri yüklemek hiçbir şey eklemez', async ({ page }) => {
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'CSV dışa aktar' }).click()
  const path = await (await downloadPromise).path()

  await page.locator('input[type=file]').setInputFiles({
    name: 'export.csv',
    mimeType: 'text/csv',
    buffer: await readFile(path),
  })
  const dialog = page.getByRole('dialog', { name: 'CSV içe aktarma' })
  await expect(dialog).toContainText('0 yeni işlem')
  await expect(dialog.getByRole('button', { name: '0 işlemi içe aktar' })).toBeDisabled()
})
