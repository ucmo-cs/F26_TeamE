import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, formatDate, money, percent } from '../api'
import NavBar from '../components/NavBar'
import type { LoanDetail } from '../types'

const adminLinks = [
  { to: '/admin/loans', label: 'Active Loans' },
  { to: '/admin/loans/new', label: 'New Loan' },
]

export default function AdminLoanDetailPage() {
  const { id } = useParams()
  const [loan, setLoan] = useState<LoanDetail | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api<LoanDetail>(`/api/admin/loans/${id}`)
      .then(setLoan)
      .catch((err: Error) => setError(err.message))
  }, [id])

  return (
    <main className="page">
      <NavBar links={adminLinks} />
      <section className="content">
        <Link className="back" to="/admin/loans">← Back to loans</Link>
        {error ? <p className="error">{error}</p> : null}
        {loan ? (
          <>
            <div className="section-head">
              <div>
                <h1>{loan.customerName}</h1>
                <p>Loan #{loan.id}</p>
              </div>
            </div>
            <div className="detail-grid">
              <article>
                <h2>Loan</h2>
                <dl>
                  <div><dt>Origination date</dt><dd>{formatDate(loan.originationDate)}</dd></div>
                  <div><dt>Amount owed</dt><dd>{money(loan.amountOwed)}</dd></div>
                  <div><dt>Original amount</dt><dd>{money(loan.originalAmount)}</dd></div>
                  <div><dt>Interest rate</dt><dd>{percent(loan.interestRate)}</dd></div>
                  <div><dt>Pay-off date</dt><dd>{formatDate(loan.payoffDate)}</dd></div>
                  <div><dt>Minimum monthly payment</dt><dd>{money(loan.minimumMonthlyPayment)}</dd></div>
                </dl>
              </article>
              <article>
                <h2>Customer</h2>
                <dl>
                  <div><dt>Email</dt><dd>{loan.customerEmail || '—'}</dd></div>
                  <div><dt>Phone</dt><dd>{loan.customerPhone || '—'}</dd></div>
                </dl>
              </article>
              <article>
                <h2>Bank details</h2>
                <dl>
                  <div><dt>Bank</dt><dd>{loan.bankName || '—'}</dd></div>
                  <div><dt>Account holder</dt><dd>{loan.accountHolderName || '—'}</dd></div>
                  <div><dt>Account</dt><dd>{loan.accountNumber || '—'}</dd></div>
                  <div><dt>Routing</dt><dd>{loan.routingNumber || '—'}</dd></div>
                </dl>
              </article>
              <article>
                <h2>Scheduled payments</h2>
                {loan.paymentFrequency ? (
                  <dl>
                    <div><dt>Frequency</dt><dd>{loan.paymentFrequency}</dd></div>
                    <div><dt>Amount</dt><dd>{money(loan.paymentAmount)}</dd></div>
                    <div><dt>Day of month</dt><dd>{loan.paymentDayOfMonth ?? '—'}</dd></div>
                    <div><dt>Day of week</dt><dd>{loan.paymentDayOfWeekName || '—'}</dd></div>
                    <div><dt>Start date</dt><dd>{formatDate(loan.paymentStartDate)}</dd></div>
                  </dl>
                ) : (
                  <p>No automatic payments scheduled.</p>
                )}
              </article>
            </div>
          </>
        ) : null}
      </section>
    </main>
  )
}
