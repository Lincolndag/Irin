import ContentPage from '../../components/ContentPage/ContentPage';
import './AdminPage.css';

export default function AdminPage() {
  return (
    <ContentPage
      eyebrow="Admin"
      title="Admin route"
      intro="A static admin screen kept only for routing and visual structure."
      image="https://commons.wikimedia.org/wiki/Special:FilePath/LEKKI%20CONSERVATION%20CENTRE.jpg"
      ctaLabel="Back to tours"
      ctaTo="/tours"
    >
      <div className="dest-loading">Admin controls can be added here next.</div>
    </ContentPage>
  );
}
