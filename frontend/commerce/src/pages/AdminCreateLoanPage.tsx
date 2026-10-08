import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import NavBar from '../components/NavBar'
import type { CreatedLoan } from '../types'

const adminLinks = [
  { to: '/admin/loans', label: 'Active Loans' },
  { to: '/admin/loans/new', label: 'New Loan' },
]

const empty = {
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  originationDate: '',
  originalAmount: '',
  interestRate: '',
}

export default function AdminCreateLoanPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(empty)
  const [result, setResult] = useState<CreatedLoan | null>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function update(field: keyof typeof empty, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setResult(null)
    setSubmitting(true)
    try {
      const created = await api<CreatedLoan>('/api/admin/loans', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          originalAmount: Number(form.originalAmount),
          interestRate: Number(form.interestRate),
        }),
      })
      setResult(created)
      setForm(empty)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create loan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="page">
      <NavBar links={adminLinks} />
      <section className="content narrow">
        <Link className="back" to="/admin/loans">← Back to loans</Link>
        <div className="section-head">
          <div>
            <h1>Create loan</h1>
            <p>Creates the loan and generates customer login credentials.</p>
          </div>
        </div>
        <form className="stack-form" onSubmit={onSubmit}>
          <label>Customer name
            <input value={form.customerName} onChange={(e) => update('customerName', e.target.value)} required />
          </label>
          <label>Email
            <input type="email" value={form.customerEmail} onChange={(e) => update('customerEmail', e.target.value)} required />
          </label>
          <label>Phone
            <input value={form.customerPhone} onChange={(e) => update('customerPhone', e.target.value)} required />
          </label>
          <label>Origination date
            <input type="date" value={form.originationDate} onChange={(e) => update('originationDate', e.target.value)} required />
          </label>
          <label>Original amount
            <input type="number" min="0.01" step="0.01" value={form.originalAmount} onChange={(e) => update('originalAmount', e.target.value)} required />
          </label>
          <label>Interest rate (%)
            <input type="number" min="0" step="0.0001" value={form.interestRate} onChange={(e) => update('interestRate', e.target.value)} required />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create loan'}</button>
        </form>
        {result ? (
          <aside className="success-panel">
            <h2>Loan created</h2>
            <p>{result.message}</p>
            <p><strong>Username:</strong> {result.username}</p>
            <p><strong>Temporary password:</strong> {result.temporaryPassword}</p>
            <p className="muted">Give these credentials to the customer. They are also written to the server log.</p>
            <button type="button" onClick={() => navigate(`/admin/loans/${result.loanId}`)}>View loan</button>
          </aside>
        ) : null}
      </section>
    </main>
  )
}
