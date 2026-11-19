import { defineConfig } from 'vitest/config'

// Firestore kural testleri: emülatör gerektirir, bu yüzden normal `npm test` içinde ÇALIŞMAZ.
// Çalıştırmak için: npm run test:rules (Java 21+ gerekir)
export default defineConfig({
  test: {
    environment: 'node',
    include: ['rules-tests/**/*.test.ts'],
    // Tüm dosyalar aynı emülatörü paylaştığı için sırayla çalışır.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
})
