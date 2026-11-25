import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <main className="app">
      <header className="hero">
        <div className="hero-label">Buku Belanja</div>
        <h1 className="hero-big" style={{ fontSize: 48 }}>Log masuk</h1>
        <div className="hero-sub">Rekod belanja, kawal bajet.</div>
      </header>
      <LoginForm />
    </main>
  )
}
