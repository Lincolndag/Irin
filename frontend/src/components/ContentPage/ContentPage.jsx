import { Link } from 'react-router-dom';
import { resolveBackendImageUrl } from '../../utils/api';
import './ContentPage.css';

export default function ContentPage({
  eyebrow,
  title,
  intro,
  image,
  children,
  ctaLabel,
  ctaTo = '/tours',
  muted,
}) {
  return (
    <main className="content-page">
      <section
        className="cp-hero"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(24,19,16,.24), rgba(24,19,16,.9)), url(${resolveBackendImageUrl(image)})`,
        }}
      >
        <div className="cp-hero-inner">
          {eyebrow && <div className="cp-eyebrow">{eyebrow}</div>}
          <h1>{title}</h1>
          {intro && <p>{intro}</p>}
          {ctaLabel && (
            <Link to={ctaTo} className="cp-cta">{ctaLabel}</Link>
          )}
        </div>
      </section>
      <section className="cp-body">
        <div className={`cp-shell${muted ? ' muted' : ''}`}>
          {children}
        </div>
      </section>
    </main>
  );
}
