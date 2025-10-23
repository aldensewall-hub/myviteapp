import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import '../App.css'
import { getUser, logout, subscribe } from '../services/auth'

export default function Layout() {
  const navigate = useNavigate()
  const [user, setUser] = useState(getUser())

  useEffect(() => {
    const unsub = subscribe(setUser)
    return unsub
  }, [])

  return (
    <div className="app-shell">
      <header className="top-header">
        <NavLink to="/" className="brand">World Boutique</NavLink>
        <nav className="nav">
          <NavLink to="/profile" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>My Profile</NavLink>
          <NavLink to="/shop" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Shop</NavLink>
          <NavLink to="/settings" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Settings</NavLink>
        </nav>
        <div style={{ gridColumn: 3, justifySelf: 'end' }}>
          {user ? (
            <button
              type="button"
              className="btn-save"
              onClick={() => { logout(); navigate('/') }}
            >Sign out</button>
          ) : (
            <NavLink to="/" className="nav-link">Sign in</NavLink>
          )}
        </div>
      </header>
      <main className="page-container">
        <Outlet />
      </main>
    </div>
  )
}
