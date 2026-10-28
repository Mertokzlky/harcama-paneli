export function SetupNotice() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-5 py-10">
      <h1 className="text-2xl font-extrabold">Firebase yapılandırması eksik</h1>
      <p className="mt-3 text-muted">
        Uygulama kendi Firebase projenin anahtarlarına ihtiyaç duyar. Anahtarlar repoda tutulmaz.
      </p>
      <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm">
        <li>
          Proje klasöründe <code className="rounded bg-surface-2 px-1.5 py-0.5">.env.example</code> dosyasını{' '}
          <code className="rounded bg-surface-2 px-1.5 py-0.5">.env</code> olarak kopyala.
        </li>
        <li>Firebase konsolundaki Web uygulaması ayarlarından değerleri doldur.</li>
        <li>
          Geliştirme sunucusunu yeniden başlat (<code className="rounded bg-surface-2 px-1.5 py-0.5">npm run dev</code>).
        </li>
      </ol>
      <p className="mt-5 text-sm text-muted">
        Sadece denemek istersen <code className="rounded bg-surface-2 px-1.5 py-0.5">VITE_DEMO_MODE=true</code> ile
        yerel demo verisiyle çalıştırabilirsin. Ayrıntılar README’de.
      </p>
    </main>
  )
}
