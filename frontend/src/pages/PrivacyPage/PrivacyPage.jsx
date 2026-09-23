import ContentPage from '../../components/ContentPage/ContentPage';
import './PrivacyPage.css';

export default function PrivacyPage() {
  return (
    <ContentPage
      eyebrow="Legal"
      title="Privacy policy"
      intro="A plain-language privacy page so the footer links stay useful."
      image="https://commons.wikimedia.org/wiki/Special:FilePath/Lagos%20skyline.jpg"
      ctaLabel="Terms of service"
      ctaTo="/terms"
      muted
    >
      <div className="legal-card">
        <p>This privacy page is kept for routing and presentation.</p>
        <p>Replace this with your actual policy before production use.</p>
      </div>
    </ContentPage>
  );
}
