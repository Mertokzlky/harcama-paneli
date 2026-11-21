import { expect, test } from '@playwright/test'
import { login } from './helpers.ts'

test('giriş yapınca panel açılır, çıkış yapınca giriş ekranına dönülür', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Giriş yap' })).toBeVisible()
  await expect(page.getByText('Demo modu açık')).toBeVisible()

  await login(page)
  await expect(page.getByRole('region', { name: 'Aylık bütçeler' })).toBeVisible()

  await page.getByRole('button', { name: 'Çıkış yap' }).click()
  await expect(page.getByRole('heading', { name: 'Giriş yap' })).toBeVisible()
})

test('oturum sayfa yenilenince korunur', async ({ page }) => {
  await login(page)
  await page.reload()
  await expect(page.getByRole('banner').getByText('Harcama Paneli')).toBeVisible()
})
