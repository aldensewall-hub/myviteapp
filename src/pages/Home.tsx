import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { login } from '../services/auth'

export default function Home() {
  const navigate = useNavigate()
  const location = useLocation() as any
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email.trim(), password)
      const dest = location?.state?.from?.pathname || '/shop'
      navigate(dest, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="home-page" style={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }}>
      <div className="login-card" style={{ width: 'min(480px, 100%)', background: '#fff', border: '1px solid #efe4c9', borderRadius: 12, padding: 16, textAlign: 'left', boxShadow: '0 8px 18px rgba(0,0,0,0.06)' }}>
        <h1 style={{ marginTop: 0, color: '#2b2b2b' }}>Welcome</h1>
        <p style={{ marginTop: 4, color: '#6b6b6b' }}>Sign in to continue to World Boutique.</p>
        <form onSubmit={onSubmit} className="login-form" style={{ display: 'grid', gap: 12, marginTop: 12 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontWeight: 600, color: '#2b2b2b' }}>Email</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #efe4c9' }}
            />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontWeight: 600, color: '#2b2b2b' }}>Password</span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #efe4c9' }}
            />
          </label>
          {error && <div className="status error" role="alert">{error}</div>}
          <button type="submit" className="btn-save" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </section>
  )
}
