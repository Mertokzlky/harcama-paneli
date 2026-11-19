import { readFileSync } from 'node:fs'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, setDoc } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach } from 'vitest'

let env: RulesTestEnvironment | undefined

/**
 * Test dosyasının başında bir kez çağrılır: kuralları emülatöre yükler, her testten önce veriyi temizler.
 * Emülatör adresi `firebase emulators:exec` tarafından ortam değişkeniyle verilir.
 */
export function setupRulesTestEnv() {
  beforeAll(async () => {
    env = await initializeTestEnvironment({
      projectId: 'demo-harcama-paneli',
      firestore: { rules: readFileSync('firestore.rules', 'utf8') },
    })
  })
  beforeEach(async () => {
    await getEnv().clearFirestore()
  })
  afterAll(async () => {
    await env?.cleanup()
  })
}

function getEnv(): RulesTestEnvironment {
  if (!env) throw new Error('Test ortamı hazır değil: setupRulesTestEnv() çağrıldı mı?')
  return env
}

/** Giriş yapmış kullanıcı olarak Firestore. */
export const asUser = (uid: string) => getEnv().authenticatedContext(uid).firestore()

/** Giriş yapmamış (anonim) istemci olarak Firestore. */
export const anonymous = () => getEnv().unauthenticatedContext().firestore()

/** Kuralları devre dışı bırakarak başlangıç verisi yazar (yalnızca test hazırlığı için). */
export async function seed(path: string, data: Record<string, unknown>) {
  await getEnv().withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), path), data)
  })
}
