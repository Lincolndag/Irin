import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="fi">
        <div className="fl">Ìr<span>ì</span>n</div>
        <div className="flr">
          <Link to="/tours">Tours</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
        </div>
      </div>
      <p className="fc">© 2026 Ìrìn Tours Nigeria. All rights reserved.</p>
    </footer>
  );
}
