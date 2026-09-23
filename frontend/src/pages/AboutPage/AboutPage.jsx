import ContentPage from '../../components/ContentPage/ContentPage';
import './AboutPage.css';

export default function AboutPage() {
  return (
    <ContentPage
      eyebrow="About Irin"
      title="Travel rooted in places, stories, and real discovery"
      intro="Irin is a travel experience designed to help people browse memorable journeys, compare options clearly, and move from inspiration to booking without friction."
      image="https://commons.wikimedia.org/wiki/Special:FilePath/Obudu%20Mountain%20Resort%2012.jpg"
      ctaLabel="See tours"
      ctaTo="/tours"
    >
      <div className="about-stack">
        <section className="about-feature about-feature-wide">
          <div className="feature-kicker">Our mission</div>
          <h2>Make travel browsing feel calm, visual, and easy to trust.</h2>
          <p>
            Irin is built for people who want more than a generic list of tours.
            The goal is to present destinations with enough context to compare
            them, enough visual identity to make them memorable, and enough
            structure to feel simple on desktop and mobile.
          </p>
        </section>

        <div className="story-grid">
          <section className="story-card">
            <h3>What Irin helps you do</h3>
            <p>
              Explore curated tours, open a detail page, and understand the
              basics at a glance: price, difficulty, duration, region, and
              overall experience.
            </p>
          </section>

          <section className="story-card">
            <h3>How the experience is designed</h3>
            <p>
              The interface leans on warm typography, strong spacing, and theme
              variables so the site feels consistent in light mode and dark
              mode without needing separate pages.
            </p>
          </section>

          <section className="story-card">
            <h3>What the build focuses on</h3>
            <p>
              Clear navigation, reusable components, responsive layouts, and a
              simple auth flow that makes sign up and login feel connected to the
              rest of the app.
            </p>
          </section>
        </div>

        <section className="about-band">
          <div className="about-band-item">
            <span>Theme-aware UI</span>
            <p>Every major page reads from the same CSS variables, so the active theme carries through the whole app.</p>
          </div>
          <div className="about-band-item">
            <span>Travel first</span>
            <p>The content is centered on tours and destination discovery, not filler dashboards or unrelated screens.</p>
          </div>
          <div className="about-band-item">
            <span>Built to grow</span>
            <p>The app is structured so new pages, booking logic, and account features can slot in without a redesign.</p>
          </div>
        </section>
      </div>
    </ContentPage>
  );
}
