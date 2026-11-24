'use client'

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="paper">
      <div className="row"><span className="m" /><h1 className="t">Tak dapat muatkan data</h1><span /></div>
      <div className="row"><span className="m" /><span className="t soft">Semak sambungan internet, kemudian cuba lagi.</span><span /></div>
      <div className="indent" style={{ marginTop: 16 }}>
        <button className="btn" onClick={reset}>Cuba lagi</button>
      </div>
    </main>
  )
}
