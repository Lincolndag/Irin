import ContentPage from '../../components/ContentPage/ContentPage';
import './ContactPage.css';

export default function ContactPage() {
  return (
    <ContentPage
      eyebrow="Contact"
      title="Talk to us about routes, bookings, or fixes"
      intro="A simple contact screen with no request handling, just the visual structure and navigation in place."
      image="https://commons.wikimedia.org/wiki/Special:FilePath/Lagos%20skyline.jpg"
      ctaLabel="Back home"
      ctaTo="/tours"
    >
      <div className="contact-grid">
        <section className="contact-card">
          <h2>Reach Us</h2>
          <p>For travel questions, page feedback, or route ideas, use the details below.</p>
          <div><strong>Email:</strong> hello@irin.tours</div>
          <div><strong>Base:</strong> Lagos, Nigeria</div>
          <div><strong>Hours:</strong> Mon-Fri, 9am-5pm WAT</div>
        </section>
        <div className="contact-card contact-info">
          <h2>Support</h2>
          <p>Support copy, contact details, and layout are all static here.</p>
          <div><strong>Reply time:</strong> Usually within one business day</div>
          <div><strong>Location:</strong> Nigeria</div>
          <div><strong>Mode:</strong> Visual only</div>
        </div>
      </div>
    </ContentPage>
  );
}
