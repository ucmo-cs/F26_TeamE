import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api, formatDate, money } from '../api'
import NavBar from '../components/NavBar'
import type { LoanDetail, MinimumPayment } from '../types'

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

export default function CustomerSchedulePage() {
  const [loan, setLoan] = useState<LoanDetail | null>(null)
  const [frequency, setFrequency] = useState('MONTHLY')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [dayOfMonth, setDayOfMonth] = useState('15')
  const [dayOfWeek, setDayOfWeek] = useState('FRIDAY')
  const [startDate, setStartDate] = useState('')
  const [minimum, setMinimum] = useState<MinimumPayment | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api<LoanDetail>('/api/customer/loan')
      .then((data) => {
        setLoan(data)
        if (data.paymentFrequency) setFrequency(data.paymentFrequency)
        if (data.paymentAmount != null) setPaymentAmount(String(data.paymentAmount))
        if (data.paymentDayOfMonth != null) setDayOfMonth(String(data.paymentDayOfMonth))
        if (data.paymentDayOfWeekName) setDayOfWeek(data.paymentDayOfWeekName)
        if (data.paymentStartDate) setStartDate(data.paymentStartDate)
      })
      .catch((err: Error) => setError(err.message))
  }, [])

  useEffect(() => {
    api<MinimumPayment>(`/api/customer/minimum-payment?frequency=${frequency}`)
      .then(setMinimum)
      .catch((err: Error) => setError(err.message))
  }, [frequency])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        frequency,
        paymentAmount: Number(paymentAmount),
        startDate,
      }
      if (frequency === 'MONTHLY') {
        body.dayOfMonth = Number(dayOfMonth)
      } else {
        body.dayOfWeek = dayOfWeek
      }

      const updated = await api<LoanDetail>('/api/customer/schedule', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      setLoan(updated)
      setMessage('Payment schedule saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save schedule')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="page">
      <NavBar links={[
        { to: '/customer/loan', label: 'My Loan' },
        { to: '/customer/schedule', label: 'Schedule Payments' },
      ]} />
      <section className="content narrow">
        <div className="section-head">
          <div>
            <h1>Schedule payments</h1>
            <p>Choose a recurring schedule. Payments cannot be below the calculated minimum.</p>
          </div>
        </div>

        {loan ? (
          <aside className="info-panel">
            <p><strong>Amount owed:</strong> {money(loan.amountOwed)}</p>
            <p><strong>Current pay-off date:</strong> {formatDate(loan.payoffDate)}</p>
            {minimum ? (
              <p>
                <strong>Minimum for {frequency.toLowerCase()} schedule:</strong> {money(minimum.minimumPayment)}
                <span className="muted"> ({minimum.paymentsPerYear} payments/year)</span>
              </p>
            ) : null}
          </aside>
        ) : null}

        <form className="stack-form" onSubmit={onSubmit}>
          <label>
            Frequency
            <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
              <option value="MONTHLY">Monthly (same date each month)</option>
              <option value="BIWEEKLY">Bi-weekly (same weekday every two weeks)</option>
              <option value="WEEKLY">Weekly (same weekday every week)</option>
            </select>
          </label>

          {frequency === 'MONTHLY' ? (
            <label>
              Day of month
              <input type="number" min="1" max="28" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} required />
            </label>
          ) : (
            <label>
              Day of week
              <select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
                {DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
              </select>
            </label>
          )}

          <label>
            Payment amount
            <input
              type="number"
              min={minimum?.minimumPayment ?? 0.01}
              step="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              required
            />
          </label>
          <label>
            Start date
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </label>

          {error ? <p className="error">{error}</p> : null}
          {message ? <p className="success">{message}</p> : null}
          <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save schedule'}</button>
        </form>
      </section>
    </main>
  )
}
