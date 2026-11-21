import { expect, test } from '@playwright/test'
import { addTransaction, login } from './helpers.ts'

test('bütçe limiti: tamam → uyarı → aşıldı → kaldırıldı', async ({ page }) => {
  await login(page)
  const panel = page.getByRole('region', { name: 'Aylık bütçeler' })
  const bar = panel.getByRole('progressbar', { name: 'Sağlık bütçesi' })

  // Demo verisinde "Sağlık" için limit yok ve bu ay harcama yok.
  await expect(bar).toHaveCount(0)
  await panel.getByRole('button', { name: 'Limit ekle' }).click()
  const form = page.getByRole('dialog', { name: 'Bütçe limiti ekle' })
  await form.getByLabel('Kategori').selectOption('saglik')
  await form.getByLabel('Aylık limit (₺)').fill('1000')
  await form.getByRole('button', { name: 'Kaydet', exact: true }).click()
  await expect(page.getByText('Limit kaydedildi.')).toBeVisible()
  await expect(bar).toHaveAttribute('aria-valuenow', '0')

  // %90 → uyarı
  await addTransaction(page, { amount: '900', category: 'saglik', note: 'E2E eczane' })
  await expect(bar).toHaveAttribute('aria-valuenow', '90')
  await expect(bar).toHaveAttribute('aria-valuetext', /Limitin %90/)

  // Limit aşıldı
  await addTransaction(page, { amount: '200', category: 'saglik', note: 'E2E vitamin' })
  await expect(bar).toHaveAttribute('aria-valuenow', '100')
  await expect(bar).toHaveAttribute('aria-valuetext', /aşıldı/)

  // Limiti kaldır
  await panel.getByRole('button', { name: 'Limiti düzenle: Sağlık' }).click()
  await page.getByRole('dialog', { name: 'Bütçe limitini düzenle' }).getByRole('button', { name: 'Limiti kaldır' }).click()
  await expect(page.getByText('Limit kaldırıldı.')).toBeVisible()
  await expect(bar).toHaveCount(0)
})
