// src/components/TourCard/TourCard.jsx
import { Link } from 'react-router-dom';
import ImageWithFallback from '../ImageWithFallback/ImageWithFallback';
import './TourCard.css';

const ClockIcon = () => (
  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const chipClass = { 'Staff Pick': 'pick', Popular: 'pick', Hot: 'hot', New: 'newc', Featured: 'pick', 'Top Rated': 'pick' };

export default function TourCard({ tour }) {
  const { id, image, chip, rating, region, name, description, duration, maxGroup, difficulty, price } = tour;

  return (
    <div className="tcard">
      <div className="timg-wrap">
        <ImageWithFallback className="timg" src={image} alt={name} />
        {chip && <span className={`tchip ${chipClass[chip] ?? 'pick'}`}>{chip}</span>}
        <div className="trating">
          <span>★</span>
          <span className="trating-v">{rating}</span>
        </div>
      </div>

      <div className="tbody">
        <div className="tregion">{region}</div>
        <div className="tname">{name}</div>
        {description ? <div className="tdesc">{description}</div> : null}
        <div className="tmeta">
          <div className="tmi"><ClockIcon />{duration}</div>
          <div className="tmi">Max {maxGroup}</div>
          <div className="tmi">{difficulty}</div>
        </div>
        <div className="tfoot">
          <div className="tprice">
            {price} <small>/ person</small>
          </div>
          <Link to={`/tours/${id}`} className="tcta">View</Link>
        </div>
      </div>
    </div>
  );
}
