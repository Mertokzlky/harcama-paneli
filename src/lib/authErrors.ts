/** Firebase Auth hata kodlarını kullanıcıya anlaşılır Türkçe mesajlara çevirir. */
const MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'E-posta adresi geçerli görünmüyor.',
  'auth/invalid-credential': 'E-posta veya şifre hatalı.',
  'auth/wrong-password': 'E-posta veya şifre hatalı.',
  'auth/user-not-found': 'E-posta veya şifre hatalı.',
  'auth/email-already-in-use': 'Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.',
  'auth/weak-password': 'Şifre en az 6 karakter olmalı.',
  'auth/too-many-requests': 'Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.',
  'auth/network-request-failed': 'Bağlantı kurulamadı. İnternetini kontrol et.',
  'auth/user-disabled': 'Bu hesap devre dışı bırakılmış.',
  'auth/operation-not-allowed':
    'E-posta/şifre girişi Firebase konsolunda etkin değil (Authentication > Sign-in method).',
}

export function authErrorMessage(err: unknown): string {
  const code = typeof err === 'object' && err && 'code' in err ? String((err as { code: unknown }).code) : ''
  return MESSAGES[code] ?? 'Bir şeyler ters gitti. Lütfen tekrar dene.'
}
