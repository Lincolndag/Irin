import { Link } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout/AuthLayout';
import './ForgotPasswordPage.css';

const Visual = () => (
  <div
    className="fp-vis-inner"
    style={{
      backgroundImage:
        "linear-gradient(170deg, rgba(24,19,16,0.5) 0%, rgba(24,19,16,0.95) 100%), url('https://commons.wikimedia.org/wiki/Special:FilePath/Osun-Osogbo%20Sacred%20Grove.jpg')",
    }}
  >
    <Link to="/" className="vis-logo">Irin</Link>
    <div className="vis-main">
      <div className="vis-tag">Route</div>
      <div className="vis-head">Password reset<br />entry</div>
      <p className="vis-sub">This route keeps the same look and navigation flow.</p>
    </div>
  </div>
);

export default function ForgotPasswordPage() {
  return (
    <AuthLayout visualContent={<Visual />}>
      <h1 className="auth-h">Reset route <em>entry</em></h1>
      <p className="auth-sub">
        The page is static for now. <Link to="/login">Back to login</Link>
      </p>
    </AuthLayout>
  );
}
