'use client'

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="app">
      <div className="page-head"><h1>Tak dapat muatkan data</h1></div>
      <p className="empty">Semak sambungan internet, kemudian cuba lagi.</p>
      <div style={{ margin: '16px 20px' }}><button className="btn" onClick={reset}>Cuba lagi</button></div>
    </main>
  )
}
