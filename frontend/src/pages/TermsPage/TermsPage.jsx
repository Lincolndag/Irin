import ContentPage from '../../components/ContentPage/ContentPage';
import './TermsPage.css';

const items = [
  'Use the app for lawful travel discovery only.',
  'Tour details, prices, and availability can change.',
  'Confirm bookings before payment.',
  'Do not upload harmful or misleading content.',
];

export default function TermsPage() {
  return (
    <ContentPage
      eyebrow="Legal"
      title="Terms of service"
      intro="A simple legal page so the footer links go somewhere real."
      image="https://commons.wikimedia.org/wiki/Special:FilePath/ZUMA%20ROCK.jpg"
      ctaLabel="Privacy policy"
      ctaTo="/privacy"
      muted
    >
      <div className="legal-card">
        <ol>
          {items.map((item) => <li key={item}>{item}</li>)}
        </ol>
      </div>
    </ContentPage>
  );
}
