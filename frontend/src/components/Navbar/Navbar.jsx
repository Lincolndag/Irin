// src/components/Navbar/Navbar.jsx
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../app/auth-context';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import './Navbar.css';

const navLinks = [
  { to: '/tours', label: 'Tours' },
  { to: '/about', label: 'About' },
  { to: '/profile', label: 'Account' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const navClassName = ({ isActive }) => (isActive ? 'active' : '');
  const firstName = user?.name?.split(' ')[0] ?? 'Account';

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="nav-logo">Ìr<span>ì</span>n</Link>

        <ul className="nav-links">
          {navLinks.map(({ to, label }) => (
            <li key={to}>
              <NavLink to={to} className={navClassName}>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="nav-actions">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="nav-cta">
                Hi, {firstName}
              </Link>
              <button
                type="button"
                className="nav-cta"
                onClick={async () => {
                  try {
                    await logout();
                  } catch {
                    // Session cleanup is handled inside the auth provider.
                  }
                }}
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-login">
                Log In
              </Link>
              <Link to="/signup" className="nav-cta">
                Sign Up
              </Link>
            </>
          )}
        </div>

        <button
          className="hamburger"
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <span /><span /><span />
        </button>
      </nav>

      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        <button
          className="mm-close"
          type="button"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        >
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="mm-logo">Ìr<span>ì</span>n</div>

        {navLinks.map(({ to, label }) => (
          <Link key={to} to={to} onClick={() => setMenuOpen(false)}>
            {label}
          </Link>
        ))}
        <ThemeToggle />
        {isAuthenticated ? (
          <>
            <Link to="/profile" onClick={() => setMenuOpen(false)}>
              Hi, {firstName}
            </Link>
            <button
              type="button"
              className="gold"
              onClick={async () => {
                try {
                  await logout();
                } catch {
                  // Session cleanup is handled inside the auth provider.
                } finally {
                  setMenuOpen(false);
                }
              }}
            >
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-login" onClick={() => setMenuOpen(false)}>
              Log In
            </Link>
            <Link to="/signup" className="gold" onClick={() => setMenuOpen(false)}>
              Sign Up Free
            </Link>
          </>
        )}
      </div>
    </>
  );
}
