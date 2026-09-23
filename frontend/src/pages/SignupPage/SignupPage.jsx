import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import AuthLayout from '../../components/AuthLayout/AuthLayout';
import { useAuth } from '../../app/auth-context';
import { signupUser } from '../../utils/api';
import './SignupPage.css';

const schema = yup.object({
  name: yup
    .string()
    .trim()
    .required('Name is required'),
  email: yup
    .string()
    .email('Enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  passwordConfirm: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords do not match')
    .required('Please confirm your password'),
  agreed: yup
    .boolean()
    .oneOf([true], 'You must accept the terms to continue'),
});

const getStrength = (pw = '') => {
  if (!pw) return { level: 0, label: '' };
  if (pw.length < 6) return { level: 1, label: 'Too short' };
  const score = [pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)]
    .filter(Boolean).length;
  if (score <= 1) return { level: 1, label: 'Weak' };
  if (score <= 3) return { level: 2, label: 'Fair' };
  return { level: 3, label: 'Strong' };
};

const barClass = (bar, level) => {
  if (!level) return '';
  if (level === 1) return bar <= 1 ? 'weak' : '';
  if (level === 2) return bar <= 2 ? 'med' : '';
  return 'strong';
};

const EyeIcon = ({ open }) => open
  ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

const Visual = () => (
  <div className="avis-inner" style={{ backgroundImage: "linear-gradient(160deg, rgba(22,40,32,0.52) 0%, rgba(22,40,32,0.92) 100%), url('https://commons.wikimedia.org/wiki/Special:FilePath/LEKKI%20CONSERVATION%20CENTRE.jpg')" }}>
    <Link to="/" className="vis-logo">Irin</Link>
    <div className="vis-main">
      <div className="vis-tag">Join Irin</div>
      <div className="vis-head">Start your<br /><em>journey</em></div>
      <p className="vis-sub">Create an account to book tours, save favourites, and manage your trips.</p>
    </div>
  </div>
);

export default function SignupPage() {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [serverError, setServerError] = useState('');
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema) });

  // watch password live for the strength meter
  const passwordValue = watch('password', '');
  const strength = getStrength(passwordValue);

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const res = await signupUser(data.name, data.email, data.password, data.passwordConfirm);
      login(res?.data?.user ?? res?.user ?? null);
      navigate('/tours');
    } catch (err) {
      // backend errors (duplicate email, etc.) show here
      setServerError(err.message);
    }
  };

  return (
    <AuthLayout visualContent={<Visual />}>
      <h1 className="auth-h">Create your <em>account</em></h1>
      <p className="auth-sub">
        Already have one? <Link to="/login">Sign in</Link>
      </p>

      <div className="signup-form">
        {serverError && <div className="error-banner">{serverError}</div>}

        <div className="fg">
          <label className="flabel" htmlFor="name">Full name</label>
          <input
            id="name"
            className={`finput${errors.name ? ' invalid' : ''}`}
            type="text"
            placeholder="Ada Okonkwo"
            {...register('name')}
          />
          {errors.name && <span className="ferror">{errors.name.message}</span>}
        </div>

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

        <div className="form-row">
          <div className="fg">
            <label className="flabel" htmlFor="password">Password</label>
            <div className="pw-wrap">
              <input
                id="password"
                className={`finput${errors.password ? ' invalid' : ''}`}
                type={showPw ? 'text' : 'password'}
                placeholder="Min 8 characters"
                {...register('password')}
              />
              <button
                className="ptoggle"
                type="button"
                onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                <EyeIcon open={showPw} />
              </button>
            </div>
            {passwordValue && (
              <>
                <div className="sbars">
                  <div className={`sbar ${barClass(1, strength.level)}`} />
                  <div className={`sbar ${barClass(2, strength.level)}`} />
                  <div className={`sbar ${barClass(3, strength.level)}`} />
                </div>
                <span className="stext">{strength.label}</span>
              </>
            )}
            {errors.password && <span className="ferror">{errors.password.message}</span>}
          </div>

          <div className="fg">
            <label className="flabel" htmlFor="passwordConfirm">Confirm password</label>
            <input
              id="passwordConfirm"
              className={`finput${errors.passwordConfirm ? ' invalid' : ''}`}
              type={showPw ? 'text' : 'password'}
              placeholder="Repeat password"
              {...register('passwordConfirm')}
            />
            {errors.passwordConfirm && <span className="ferror">{errors.passwordConfirm.message}</span>}
          </div>
        </div>

        <div className="terms-row">
          <input
            id="agreed"
            className="tcheck"
            type="checkbox"
            {...register('agreed')}
          />
          <label className="ttext" htmlFor="agreed">
            I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>
          </label>
        </div>
        {errors.agreed && <span className="ferror">{errors.agreed.message}</span>}

        <button
          className="btn-main"
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </div>
    </AuthLayout>
  );
}
