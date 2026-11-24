import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <main className="paper">
      <div className="row" style={{ minHeight: 'calc(var(--line) * 4)' }}>
        <span className="m" />
        <div className="t">
          <p className="soft" style={{ margin: 0 }}>Buku Belanja</p>
          <h1 className="display" style={{ fontSize: 40, lineHeight: '48px', fontWeight: 800 }}>Log masuk</h1>
        </div>
        <span />
      </div>
      <LoginForm />
    </main>
  )
}
