// src/components/AuthLayout/AuthLayout.jsx
import './AuthLayout.css';

/**
 * Two-column auth layout.
 * Left -> decorative visual panel (hidden on mobile)
 * Right -> form panel
 */
export default function AuthLayout({ visualContent, children }) {
  return (
    <div className="auth-root">
      <div className="auth-vis">
        <div className="avis-pattern" />
        {visualContent}
      </div>
      <div className="auth-panel">
        <div className="auth-inner">{children}</div>
      </div>
    </div>
  );
}
