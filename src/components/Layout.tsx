import { NavLink, Outlet } from 'react-router-dom'
import '../App.css'

export default function Layout() {
  return (
    <div className="app-shell">
      <header className="top-header">
        <NavLink to="/shop" className="brand">World Boutique</NavLink>
        <nav className="nav">
          <NavLink to="/profile" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>My Profile</NavLink>
          <NavLink to="/shop" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Shop</NavLink>
          <NavLink to="/settings" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>Settings</NavLink>
        </nav>
      </header>
      <main className="page-container">
        <Outlet />
      </main>
    </div>
  )
}