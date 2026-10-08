import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { homePath, useAuth } from '../auth'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  if (user) {
    return <Navigate to={homePath(user.role)} replace />
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError('')

    try {
      const loggedIn = await login(username, password)
      navigate(homePath(loggedIn.role), { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <p className="eyebrow">FivePoint Bank</p>
        <h1>Loan Repayment Tracker</h1>
        <p className="lede">Sign in to manage loans or your repayment schedule.</p>
        <form onSubmit={handleLogin}>
          <label htmlFor="username">
            Username
            <input
              id="username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>
          <label htmlFor="password">
            Password
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error ? <p className="error" role="status">{error}</p> : null}
          <button type="submit" disabled={pending}>
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="muted center-link">
          New customer?{' '}
          <Link to="/signup">Create an account &amp; request a loan</Link>
        </p>
        <aside className="demo-creds">
          <h2>Demo accounts</h2>
          <p><strong>Admin:</strong> admin / admin</p>
          <p><strong>Jane Smith:</strong> jsmith / customer1</p>
          <p><strong>Marcus Johnson:</strong> mjohnson / customer2</p>
          <p><strong>Aisha Chen:</strong> achen / customer3</p>
          <p><strong>Rohan Patel:</strong> rpatel / customer4</p>
        </aside>
      </section>
    </main>
  )
}
