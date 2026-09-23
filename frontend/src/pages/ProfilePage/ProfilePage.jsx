import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../app/auth-context';
import ImageWithFallback from '../../components/ImageWithFallback/ImageWithFallback';
import ContentPage from '../../components/ContentPage/ContentPage';
import { deleteMe, updateMe } from '../../utils/api';
import './ProfilePage.css';

const schema = yup.object({
  name: yup.string().trim().required('Name is required'),
  email: yup.string().email('Enter a valid email address').required('Email is required'),
});

const formatDate = (value) => {
  if (!value) return 'Recently joined';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently joined';

  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const initialsFromName = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'IR';
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('');
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, login, logout } = useAuth();
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user?.photo ?? '');
  const photoInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
    },
  });

  useEffect(() => {
    reset({
      name: user?.name ?? '',
      email: user?.email ?? '',
    });
  }, [reset, user]);

  useEffect(() => {
    setPhotoPreview(user?.photo ?? '');
    setPhotoFile(null);
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  }, [user]);

  useEffect(() => {
    if (!photoFile) return undefined;

    const previewUrl = URL.createObjectURL(photoFile);
    setPhotoPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [photoFile]);

  const firstName = useMemo(() => {
    if (!user?.name) return 'traveler';
    return user.name.split(' ')[0];
  }, [user?.name]);

  if (loading) {
    return (
      <ContentPage
        eyebrow="Account"
        title="Checking your session"
        intro="We are reading your secure session cookie and loading your account."
        image="https://commons.wikimedia.org/wiki/Special:FilePath/Lagos%20skyline.jpg"
        ctaLabel="Back to tours"
        ctaTo="/tours"
      >
        <div className="saved-empty">Loading your account details...</div>
      </ContentPage>
    );
  }

  if (!isAuthenticated) {
    return (
      <ContentPage
        eyebrow="Account"
        title="Sign in to manage your account"
        intro="Your profile and account settings live here once you log in."
        image="https://commons.wikimedia.org/wiki/Special:FilePath/Lagos%20skyline.jpg"
        ctaLabel="Log in"
        ctaTo="/login"
      >
        <div className="saved-empty">
          You are not signed in right now. Log in to update your profile and view your account details.
        </div>
      </ContentPage>
    );
  }

  const joinDate = formatDate(user?.createdAt);
  const role = user?.role ? user.role.replace('-', ' ') : 'member';
  const avatarText = initialsFromName(user?.name);
  const avatarSource = photoPreview || user?.photo || '';

  const onSubmit = async (data) => {
    setError('');
    setStatus('');

    try {
      const res = await updateMe({
        name: data.name,
        email: data.email,
        photo: photoFile,
      });
      const updatedUser = res?.data?.user ?? res?.data?.data?.user ?? res?.user ?? {
        ...user,
        name: data.name,
        email: data.email,
        photo: photoPreview || user?.photo,
      };

      login({
        ...user,
        ...updatedUser,
      });

      setStatus('Profile updated successfully.');
    } catch (err) {
      setError(err.message || 'Unable to update profile');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handlePhotoChange = (event) => {
    const [file] = event.target.files || [];
    setPhotoFile(file || null);
  };

  const handleReset = () => {
    reset({
      name: user?.name ?? '',
      email: user?.email ?? '',
    });
    setPhotoFile(null);
    setPhotoPreview(user?.photo ?? '');
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Delete your account? This will deactivate the account on the server and sign you out.',
    );

    if (!confirmed) return;

    setDeleting(true);
    setError('');
    setStatus('');

    try {
      await deleteMe();
      await logout();
      navigate('/signup');
    } catch (err) {
      setError(err.message || 'Unable to delete account');
    } finally {
      setDeleting(false);
    }
  };

  const sections = {
    overview: (
      <section className="card">
        <div className="card-hdr">
          <div className="card-title">Account <em>overview</em></div>
        </div>
        <div className="card-body">
          <div className="overview-grid">
            <div className="overview-hero">
              <div className="avatar-wrap">
                {avatarSource ? (
                  <ImageWithFallback
                    className="avatar"
                    src={avatarSource}
                    alt={`${user?.name ?? 'Traveler'} profile`}
                  />
                ) : (
                  <div className="avatar avatar-fallback">{avatarText}</div>
                )}
              </div>
              <div className="p-info">
                <div className="p-role">{role}</div>
                <div className="p-name">{user?.name ?? 'Traveler'}</div>
                <div className="p-email">{user?.email ?? 'No email available'}</div>
              </div>
            </div>

            <div className="account-stats">
              <div className="stat-card">
                <div className="stat-num">Active</div>
                <div className="stat-label">Session status</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{joinDate}</div>
                <div className="stat-label">Member since</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{firstName}</div>
                <div className="stat-label">Display name</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    ),
    profile: (
      <section className="card">
        <div className="card-hdr">
          <div className="card-title">Profile <em>details</em></div>
        </div>
        <div className="card-body">
          <form className="account-form" onSubmit={handleSubmit(onSubmit)}>
            {status && <div className="success-banner">{status}</div>}
            {error && <div className="error-banner">{error}</div>}

            <div className="photo-upload">
              <div className="photo-preview">
                {avatarSource ? (
                  <ImageWithFallback
                    className="photo-preview-image"
                    src={avatarSource}
                    alt={`${user?.name ?? 'Traveler'} profile preview`}
                  />
                ) : (
                  <div className="avatar avatar-fallback photo-fallback">{avatarText}</div>
                )}
              </div>

              <div className="photo-copy">
                <label className="flabel" htmlFor="photo">Profile photo</label>
                <input
                  ref={photoInputRef}
                  id="photo"
                  className="finput photo-input"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
                <p className="fhelper">
                  PNG, JPG, or WEBP up to 5 MB. We resize and compress it on the server before saving it.
                </p>
              </div>
            </div>

            <div className="fgrid">
              <div className="fg">
                <label className="flabel" htmlFor="name">Full name</label>
                <input
                  id="name"
                  className={`finput${errors.name ? ' invalid' : ''}`}
                  type="text"
                  placeholder="Your name"
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

              <div className="fg full">
                <p className="fhelper">
                  Update the name and email tied to your Irin account. Changes
                  save to the backend and refresh the signed-in account state
                  at the same time.
                </p>
              </div>
            </div>

            <div className="form-actions">
              <button className="btn-save" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save changes'}
              </button>
              <button
                className="btn-cancel"
                type="button"
                onClick={handleReset}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </section>
    ),
    security: (
      <section className="card danger-card">
        <div className="card-hdr">
          <div className="card-title danger-title">Security & session</div>
        </div>
        <div className="card-body">
          <div className="drow">
            <div>
              <div className="dtitle">Password management</div>
              <div className="ddesc">
                Password updates are handled through the reset-password flow so
                the security rules stay in one place.
              </div>
            </div>
            <Link to="/forgot-password" className="btn-cancel">
              Reset password
            </Link>
          </div>

          <div className="drow">
            <div>
              <div className="dtitle">Current session</div>
              <div className="ddesc">
                You are signed in on this device as {user?.name ?? 'a traveler'}.
                Use log out to end the current session.
              </div>
            </div>
            <button className="btn-cancel" type="button" onClick={handleLogout}>
              Log out
            </button>
          </div>

          <div className="drow">
            <div>
              <div className="dtitle">Delete account</div>
              <div className="ddesc">
                This disables your account on the server and removes your active
                session from the app.
              </div>
            </div>
            <button className="btn-danger" type="button" onClick={handleDeleteAccount} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete account'}
            </button>
          </div>
        </div>
      </section>
    ),
  };

  return (
    <ContentPage
      eyebrow="Account"
      title={`Welcome back, ${firstName}`}
      intro="Manage your profile, session, and security from one place. Changes sync back to the account stored on the server."
      image="https://commons.wikimedia.org/wiki/Special:FilePath/Lagos%20skyline.jpg"
      ctaLabel="Back to tours"
      ctaTo="/tours"
    >
      <div className="profile-layout">
        <aside className="snav">
          <button
            className={`snav-item${activeSection === 'overview' ? ' on' : ''}`}
            type="button"
            onClick={() => setActiveSection('overview')}
          >
            Overview
          </button>
          <button
            className={`snav-item${activeSection === 'profile' ? ' on' : ''}`}
            type="button"
            onClick={() => setActiveSection('profile')}
          >
            Profile
          </button>
          <button
            className={`snav-item${activeSection === 'security' ? ' on' : ''}`}
            type="button"
            onClick={() => setActiveSection('security')}
          >
            Security
          </button>
        </aside>

        <div className="ca">
          {sections[activeSection]}
        </div>
      </div>
    </ContentPage>
  );
}
