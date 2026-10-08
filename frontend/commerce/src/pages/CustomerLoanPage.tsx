import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api, formatDate, money, percent } from '../api'
import NavBar from '../components/NavBar'
import { useAuth } from '../auth'
import type { LoanDetail } from '../types'

type ProfileForm = {
  name: string
  email: string
  phone: string
  bankName: string
  accountHolderName: string
  accountNumber: string
  routingNumber: string
}

export default function CustomerLoanPage() {
  const { user } = useAuth()
  const [loan, setLoan] = useState<LoanDetail | null>(null)
  const [form, setForm] = useState<ProfileForm | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  function applyLoan(data: LoanDetail) {
    setLoan(data.id ? data : null)
    setForm({
      name: data.customerName || user?.name || user?.username || '',
      email: data.customerEmail || '',
      phone: data.customerPhone || '',
      bankName: data.bankName || '',
      accountHolderName: data.accountHolderName || data.customerName || '',
      accountNumber: data.accountNumber || '',
      routingNumber: data.routingNumber || '',
    })
  }

  useEffect(() => {
    api<LoanDetail>('/api/customer/loan')
      .then(applyLoan)
      .catch((err: Error) => setError(err.message))
  }, [])

  function update(field: keyof ProfileForm, value: string) {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  async function onSave(event: FormEvent) {
    event.preventDefault()
    if (!form) return
    setError('')
    setMessage('')
    setSaving(true)
    try {
      const updated = await api<LoanDetail>('/api/customer/profile', {
        method: 'PUT',
        body: JSON.stringify(form),
      })
      applyLoan(updated)
      setMessage('Profile saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  const nav = [
    { to: '/customer/loan', label: 'My Loan' },
    ...(loan ? [{ to: '/customer/schedule', label: 'Schedule Payments' }] : []),
  ]

  return (
    <main className="page">
      <NavBar links={nav} />
      <section className="content">
        <div className="section-head">
          <div>
            <h1>My loan</h1>
            <p>Review balances and keep your contact and bank details up to date.</p>
          </div>
        </div>
        {error ? <p className="error">{error}</p> : null}

        {!loan && form ? (
          <aside className="info-panel">
            <h2>No loan yet</h2>
            <p>You do not have an active loan. An admin can create one for you.</p>
          </aside>
        ) : null}

        {form ? (
          <div className="detail-grid">
            {loan ? (
              <article>
                <h2>Loan summary</h2>
                <dl>
                  <div><dt>Origination date</dt><dd>{formatDate(loan.originationDate)}</dd></div>
                  <div><dt>Amount owed</dt><dd>{money(loan.amountOwed)}</dd></div>
                  <div><dt>Original amount</dt><dd>{money(loan.originalAmount)}</dd></div>
                  <div><dt>Interest rate</dt><dd>{percent(loan.interestRate)}</dd></div>
                  <div><dt>Pay-off date</dt><dd>{formatDate(loan.payoffDate)}</dd></div>
                  <div><dt>Minimum monthly payment</dt><dd>{money(loan.minimumMonthlyPayment)}</dd></div>
                </dl>
              </article>
            ) : null}
            <article>
              <h2>My details</h2>
              <form className="stack-form bare" onSubmit={onSave}>
                <label>Name<input value={form.name} onChange={(e) => update('name', e.target.value)} required /></label>
                <label>Email<input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required /></label>
                <label>Phone<input value={form.phone} onChange={(e) => update('phone', e.target.value)} required /></label>
                <label>Bank name<input value={form.bankName} onChange={(e) => update('bankName', e.target.value)} /></label>
                <label>Account holder<input value={form.accountHolderName} onChange={(e) => update('accountHolderName', e.target.value)} /></label>
                <label>Account number<input value={form.accountNumber} onChange={(e) => update('accountNumber', e.target.value)} /></label>
                <label>Routing number<input value={form.routingNumber} onChange={(e) => update('routingNumber', e.target.value)} /></label>
                {message ? <p className="success">{message}</p> : null}
                <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save details'}</button>
              </form>
            </article>
          </div>
        ) : null}
      </section>
    </main>
  )
}
