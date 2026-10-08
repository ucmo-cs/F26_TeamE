import { Link } from 'react-router-dom'
import { useAuth } from '../auth'

type NavLink = {
  to: string
  label: string
}

export default function NavBar({ links = [] }: { links?: NavLink[] }) {
  const { user, logout } = useAuth()

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">FP</span>
        <div>
          <strong>FivePoint Bank</strong>
          <p>{user?.role === 'ADMIN' ? 'Admin Portal' : 'Customer Portal'}</p>
        </div>
      </div>
      <nav>
        {links.map((link) => (
          <Link key={link.to} to={link.to}>{link.label}</Link>
        ))}
        <button type="button" className="linkish" onClick={() => { void logout() }}>Log out</button>
      </nav>
    </header>
  )
}
