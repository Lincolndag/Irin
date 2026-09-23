import { Link } from 'react-router-dom';
import ContentPage from '../../components/ContentPage/ContentPage';
import './NotFoundPage.css';

export default function NotFoundPage() {
  return (
    <ContentPage
      eyebrow="404"
      title="Page not found"
      intro="The link exists in the UI, but the route was missing. That part is fixed now."
      image="https://commons.wikimedia.org/wiki/Special:FilePath/LEKKI%20CONSERVATION%20CENTRE.jpg"
      ctaLabel="Go to tours"
      ctaTo="/tours"
    >
      <div className="nf-card">
        <p>The page you tried to open does not exist.</p>
        <Link to="/tours">Return to tours</Link>
      </div>
    </ContentPage>
  );
}
