import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import AuthLayout from '../../components/AuthLayout/AuthLayout';
import { useAuth } from '../../app/auth-context';
import { loginUser } from '../../utils/api';
import './LoginPage.css';

const Visual = () => (
  <div className="login-vis-inner">
    <Link to="/" className="vis-logo">Irin</Link>
    <div className="vis-main">
      <div className="vis-tag">Route</div>
      <div className="vis-head">Welcome<br /><em>back</em></div>
      <p className="vis-sub">Sign in to manage your trips, save favorites, and continue where you left off.</p>
    </div>
  </div>
);

const schema = yup.object({
  email: yup
    .string()
    .email('Enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .required('Password is required'),
});

const EyeIcon = ({ open }) => open
  ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [serverError, setServerError] = useState('');
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    setServerError('');

    try {
      const res = await loginUser(data.email, data.password);
      login(res?.data?.user ?? res?.user ?? null);
      navigate('/tours');
    } catch (err) {
      setServerError(err.message || 'Unable to log in');
    }
  };

  return (
    <AuthLayout visualContent={<Visual />}>
      <h1 className="auth-h">Sign in to your <em>account</em></h1>
      <p className="auth-sub">
        New here? <Link to="/signup">Create an account</Link>
      </p>

      <div className="login-form">
        {serverError && <div className="error-banner">{serverError}</div>}

        <div className="fg">
          <label className="flabel" htmlFor="email">Email address</label>
          <input
            id="email"
            className={`finput${errors.email ? ' invalid' : ''}`}
            type="email"
            placeholder="you@example.com"
            {...register('email')}
          />
          {errors.email && <span className="ferror">{errors.email.message}</span>}
        </div>

        <div className="fg">
          <div className="flabel-row">
            <label htmlFor="password">Password</label>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
          <div className="pw-wrap">
            <input
              id="password"
              className={`finput${errors.password ? ' invalid' : ''}`}
              type={showPw ? 'text' : 'password'}
              placeholder="Your password"
              {...register('password')}
            />
            <button
              className="ptoggle"
              type="button"
              onClick={() => setShowPw((value) => !value)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              <EyeIcon open={showPw} />
            </button>
          </div>
          {errors.password && <span className="ferror">{errors.password.message}</span>}
        </div>

        <button
          className="btn-main"
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>

        <div className="or-div" aria-hidden="true">
          <span className="or-line" />
          <span className="or-text">or</span>
          <span className="or-line" />
        </div>

        <Link to="/signup" className="btn-google">
          Create a new account
        </Link>
      </div>
    </AuthLayout>
  );
}
