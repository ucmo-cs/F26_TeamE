import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, formatDate, money, percent } from '../api'
import NavBar from '../components/NavBar'
import type { LoanSummary } from '../types'

const adminLinks = [
  { to: '/admin/loans', label: 'Active Loans' },
  { to: '/admin/loans/new', label: 'New Loan' },
]

export default function AdminLoansPage() {
  const [loans, setLoans] = useState<LoanSummary[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    api<LoanSummary[] | { loans: LoanSummary[] }>('/api/admin/loans')
      .then((data) => setLoans(Array.isArray(data) ? data : data.loans))
      .catch((err: Error) => setError(err.message))
  }, [])

  return (
    <main className="page">
      <NavBar links={adminLinks} />
      <section className="content">
        <div className="section-head">
          <div>
            <h1>Active loans</h1>
            <p>Loans that have not been fully repaid.</p>
          </div>
          <Link className="button" to="/admin/loans/new">Create loan</Link>
        </div>
        {error ? <p className="error">{error}</p> : null}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Origination</th>
                <th>Amount owed</th>
                <th>Original amount</th>
                <th>Interest rate</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id}>
                  <td><Link to={`/admin/loans/${loan.id}`}>{loan.customerName}</Link></td>
                  <td>{formatDate(loan.originationDate)}</td>
                  <td>{money(loan.amountOwed)}</td>
                  <td>{money(loan.originalAmount)}</td>
                  <td>{percent(loan.interestRate)}</td>
                </tr>
              ))}
              {loans.length === 0 && !error ? (
                <tr><td colSpan={5}>No active loans.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
