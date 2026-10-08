import { Link } from 'react-router-dom'

export default function SignupPage() {
  return (
    <main className="login-page">
      <section className="login-panel">
        <p className="eyebrow">FivePoint Bank</p>
        <h1>Create an account</h1>
        <p className="lede">
          An admin creates customer accounts when a new loan is added. Use a demo
          customer login, or ask an admin to create your account.
        </p>
        <p className="muted center-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  )
}
