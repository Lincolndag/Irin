import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ImageWithFallback from '../../components/ImageWithFallback/ImageWithFallback';
import { API_ROOT, createTourBooking, resolveBackendImageUrl } from '../../utils/api';
import { useAuth } from '../../app/auth-context';
import heroFallback from '../../assets/hero.png';
import './TourDetailPage.css';
const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

// const fallbackReviews = [
//   {
//     id: 'preview-review-1',
//     rating: 5,
//     review:
//       'The pacing felt thoughtful, the stops were well chosen, and every part of the trip had a purpose.',
//     user: {
//       name: 'Maya Johnson',
//       photo: heroFallback,
//     },
//     createdAt: new Date().toISOString(),
//   },
//   {
//     id: 'preview-review-2',
//     rating: 4,
//     review:
//       'A polished itinerary with enough breathing room to enjoy the scenery without feeling rushed.',
//     user: {
//       name: 'Noah Carter',
//       photo: heroFallback,
//     },
//     createdAt: new Date().toISOString(),
//   },
// ];

function formatMoney(value) {
  const amount = Number(value ?? 0);
  return moneyFormatter.format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'TBA';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatDifficulty(value) {
  if (!value) return 'Curated';
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

function renderStars(score) {
  const rating = Math.max(0, Math.min(5, Number(score ?? 0)));

  return Array.from({ length: 5 }, (_, index) => (
    <span key={index}>{index < Math.round(rating) ? '*' : '.'}</span>
  ));
}

function normalizeTour(raw = {}) {
  return {
    id: raw.id ?? raw._id ?? '',
    name: raw.name ?? 'Untitled tour',
    summary:
      raw.summary ??
      'A curated getaway designed to feel immersive, comfortable, and easy to book.',
    description:
      raw.description ??
      'The live tour description was unavailable, so this preview keeps the page useful and visually complete.',
    price: raw.price ?? 0,
    duration: raw.duration ?? raw.durations ?? raw.days ?? 0,
    maxGroupSize: raw.maxGroupSize ?? raw.maxGroup ?? 0,
    difficulty: raw.difficulty ?? 'moderate',
    rating: raw.ratingsAverage ?? raw.rating ?? 4.5,
    ratingsQuantity: raw.ratingsQuantity ?? raw.reviews ?? 0,
    imageCover: raw.imageCover ?? raw.image ?? heroFallback,
    images: Array.isArray(raw.images) ? raw.images : [],
    startDates: Array.isArray(raw.startDates) ? raw.startDates : [],
    startLocation: raw.startLocation ?? null,
    locations: Array.isArray(raw.locations) ? raw.locations : [],
    guides: Array.isArray(raw.guides) ? raw.guides : [],
    preview: Boolean(raw.preview),
    region:
      raw.region ??
      raw.location ??
      raw.startLocation?.description ??
      'Featured journey',
  };
}

// function buildPreviewTour(id) {
//   const baseDate = new Date();
//   const addDays = (days) => {
//     const next = new Date(baseDate);
//     next.setDate(baseDate.getDate() + days);
//     return next.toISOString();
//   };

//   // return normalizeTour({
//   //   id,
//   //   name: 'The Irin Signature Escape',
//   //   summary:
//   //     'A balanced, design-forward escape with scenic stops, guided experiences, and room to actually enjoy the journey.',
//   //   description:
//   //     'This preview keeps the tour details page feeling complete while the live API loads. It pairs a polished overview, a sample itinerary, and booking cues so the route remains useful even on a fresh install.',
//   //   price: 1290,
//   //   duration: 5,
//   //   maxGroupSize: 12,
//   //   difficulty: 'moderate',
//   //   rating: 4.8,
//   //   ratingsQuantity: 86,
//   //   imageCover: heroFallback,
//   //   images: [heroFallback, heroFallback, heroFallback, heroFallback],
//   //   startDates: [addDays(14), addDays(33), addDays(58)],
//   //   startLocation: {
//   //     description: 'City pickup and welcome briefing',
//   //     address: 'Main departure lounge',
//   //   },
//   //   locations: [
//   //     {
//   //       day: 1,
//   //       address: 'Arrival and orientation',
//   //       description: 'Meet your guide, settle in, and get a clear overview of the route.',
//   //     },
//   //     {
//   //       day: 2,
//   //       address: 'Coastal viewpoints',
//   //       description: 'A slower day with scenic drives, lunch stops, and sunset photo moments.',
//   //     },
//   //     {
//   //       day: 3,
//   //       address: 'Local market walk',
//   //       description: 'Explore craft stalls and sample regional flavors with a local host.',
//   //     },
//   //     {
//   //       day: 4,
//   //       address: 'Nature reserve loop',
//   //       description: 'An easy-going day of walking, wildlife watching, and quiet time outdoors.',
//   //     },
//   //   ],
//   //   guides: [
//   //     {
//   //       name: 'Amina Bello',
//   //       photo: heroFallback,
//   //     },
//   //     {
//   //       name: 'Jonah Reed',
//   //       photo: heroFallback,
//   //     },
//   //   ],
//   //   preview: true,
//   //   region: 'West Africa',
//   // });
// }

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

export default function TourDetailArtifact() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [tour, setTour] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState('Loading live tour details...');
  const [startDate, setStartDate] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingStatus, setBookingStatus] = useState('');

  useEffect(() => {
    let active = true;

    async function loadTour() {
      setLoading(true);
      setBanner('Loading live tour details...');

      try {
        const [tourResult, reviewResult] = await Promise.allSettled([
          fetchJson(`${API_ROOT}/tours/${id}`),
          fetchJson(`${API_ROOT}/tours/${id}/reviews`),
        ]);

        if (!active) return;

        if (tourResult.status === 'fulfilled') {
          setTour(normalizeTour(tourResult.value?.data?.data));
          setBanner('');
        } else {
          setTour(null);
          setBanner('Live tour endpoint is unavailable.');
        }

        if (reviewResult.status === 'fulfilled') {
          const liveReviews = Array.isArray(reviewResult.value?.data?.data)
            ? reviewResult.value.data.data
            : [];

          setReviews(
            liveReviews.map((review) => ({
              id: review.id ?? review._id,
              rating: review.rating ?? 0,
              review: review.review ?? '',
              user: review.user ?? {},
              createdAt: review.createdAt,
            }))
          );
        } else {
          setReviews([]);
        }
      } catch {
        if (!active) return;
        setTour(null);
        setReviews([]);
        setBanner('Live tour endpoint is unavailable.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTour();

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!tour) return;

    const dates = (tour.startDates.length > 0 ? tour.startDates : [new Date().toISOString()]).slice(0, 4);

    if (!startDate && dates[0]) {
      setStartDate(dates[0]);
    }
  }, [tour, startDate]);

  if (loading) {
    return (
      <main className="tour-detail-page">
        <div className="tour-loading">Loading tour details...</div>
      </main>
    );
  }

  if (!tour) {
    return (
      <main className="tour-detail-page">
        <div className="tour-loading">
          <div style={{ marginBottom: 12 }}>
            <Link to="/tours">Back to tours</Link>
          </div>
          {banner || 'Unable to load tour details.'}
        </div>
      </main>
    );
  }

  const heroStyle = {
    backgroundImage: `linear-gradient(160deg, rgba(24,19,16,0.34) 0%, rgba(24,19,16,0.88) 100%), url(${resolveBackendImageUrl(tour.imageCover, heroFallback)})`,
  };

  const galleryImages = [
    tour.imageCover,
    ...(tour.images || []),
  ]
    .filter(Boolean)
    .filter((image, index, self) => self.indexOf(image) === index)
    .slice(0, 6);

  const itinerary =
    tour.locations.length > 0
      ? tour.locations.map((stop, index) => ({
          day: stop.day ?? index + 1,
          title: stop.address ?? `Day ${index + 1}`,
          description: stop.description ?? 'Scenic stop and guided exploration.',
        }))
      : [
          {
            day: 1,
            title: 'Arrival and welcome',
            description: 'Settle in, meet the guide, and get the route overview.',
          },
          {
            day: 2,
            title: 'Signature highlights',
            description: 'Explore the key landscapes and cultural stops that define the route.',
          },
          {
            day: 3,
            title: 'Leisure day',
            description: 'Enjoy a slower pace with time for photos, food, and local discoveries.',
          },
        ];

  const included = [
    'Local guide support from arrival to departure',
    'A balanced route with curated scenic stops',
    'Flexible departure dates where available',
    'On-trip coordination for the core itinerary',
  ];

  const excluded = [
    'International flights and visas',
    'Personal shopping and souvenirs',
    'Travel insurance unless specified',
    'Tips and optional add-ons',
  ];

  const bookingDates = (tour.startDates.length > 0 ? tour.startDates : [new Date().toISOString()]).slice(0, 4);
  const guestOptions = ['1 Person', '2 People', '3 People', '4 People'];

  const handleBookTour = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setBookingError('');
    setBookingStatus('');
    setBookingLoading(true);

    try {
      const response = await createTourBooking(tour.id, {
        guests: guestCount,
        startDate,
        paymentMethod,
      });

      const paymentUrl = response?.data?.paymentUrl ?? response?.paymentUrl;

      if (!paymentUrl) {
        throw new Error('Payment provider did not return a checkout link.');
      }

      setBookingStatus(
        `Redirecting to ${paymentMethod === 'stripe' ? 'Stripe' : 'Paystack'} checkout...`,
      );
      window.location.assign(paymentUrl);
    } catch (error) {
      setBookingError(error.message || 'Unable to start booking.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <main className="tour-detail-page">
      <section className="tour-hero">
        <div className="hero-bg" style={heroStyle} />
        <div className="hero-content">
          <div className="breadcrumb">
            <Link to="/tours">Back to tours</Link>
            <span className="bc-sep">/</span>
            <span>Tour details</span>
          </div>
          <div className="h-region">{tour.region}</div>
          <h1 className="h-title">{tour.name}</h1>
          <div className="h-meta">
            <div className="hm-item stars" aria-label={`${tour.rating} star rating`}>
              {renderStars(tour.rating)}
            </div>
            <div className="hm-item">
              {Number(tour.rating).toFixed(1)} from {tour.ratingsQuantity} reviews
            </div>
            <div className="h-chip">{formatDifficulty(tour.difficulty)}</div>
            <div className="h-chip">{tour.duration} day{tour.duration === 1 ? '' : 's'}</div>
          </div>
        </div>
      </section>

      <section className="tour-layout">
        <div className="tour-main">
          {banner ? <div className="note-banner">{banner}</div> : null}

          <section className="tour-section">
            <div className="clabel">At a glance</div>
            <div className="hgrid">
              <article className="hitem">
                <div className="hicon">T</div>
                <div className="htext">
                  <strong>{tour.duration} days</strong>
                  <br />
                  Carefully paced days with enough time to enjoy the route.
                </div>
              </article>
              <article className="hitem">
                <div className="hicon">G</div>
                <div className="htext">
                  <strong>{tour.maxGroupSize} guests max</strong>
                  <br />
                  Small enough to stay personal and responsive.
                </div>
              </article>
              <article className="hitem">
                <div className="hicon">L</div>
                <div className="htext">
                  <strong>{tour.region}</strong>
                  <br />
                  {tour.startLocation?.address ?? 'Flexible starting point depending on the route.'}
                </div>
              </article>
              <article className="hitem">
                <div className="hicon">R</div>
                <div className="htext">
                  <strong>{tour.ratingsQuantity} traveler reviews</strong>
                  <br />
                  Average rating of {Number(tour.rating).toFixed(1)} out of 5.
                </div>
              </article>
            </div>
          </section>

          <section className="tour-section">
            <div className="clabel">Trip story</div>
            <div className="story-copy">
              <p className="desc">{tour.summary}</p>
              <p className="desc">{tour.description}</p>
              <div className="story-quote">
                Built for travelers who want a premium-feeling route without losing the warmth of a guided
                local experience.
              </div>
            </div>
          </section>

          <section className="tour-section">
            <div className="clabel">What is included</div>
            <div className="hgrid">
              <div>
                <div className="inclist">
                  {included.map((item) => (
                    <div key={item} className="incrow yes">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="inclist">
                  {excluded.map((item) => (
                    <div key={item} className="incrow no">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="tour-section">
            <div className="clabel">Itinerary</div>
            <div className="itin">
              {itinerary.map((item, index) => (
                <div key={`${item.day}-${item.title}`} className={`iday ${index < itinerary.length - 1 ? 'has-line' : ''}`}>
                  <div className="inum">
                    <div className="dcircle">{item.day}</div>
                  </div>
                  <div className="ibody">
                    <div className="ititle">{item.title}</div>
                    <div className="idesc">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="tour-section">
            <div className="clabel">Gallery</div>
            <div className="gallery">
              {galleryImages.map((image, index) => (
                <ImageWithFallback
                  key={`${image}-${index}`}
                  className={`gimg ${index === 0 ? 'gimg-wide' : ''}`}
                  src={image}
                  alt={`${tour.name} image ${index + 1}`}
                />
              ))}
            </div>
          </section>

          <section className="tour-section">
            <div className="clabel">Reviews</div>
            <div className="review-list">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <article key={review.id ?? `${review.user?.name}-${review.createdAt}`} className="review-card">
                    <div className="review-head">
                      <div className="review-user">
                        <ImageWithFallback
                          className="review-avatar"
                          src={review.user?.photo || heroFallback}
                          alt={review.user?.name || 'Traveler'}
                        />
                        <div>
                          <div className="review-name">{review.user?.name || 'Traveler'}</div>
                          <div className="review-date">{formatDate(review.createdAt)}</div>
                        </div>
                      </div>
                      <div className="review-score">{renderStars(review.rating)}</div>
                    </div>
                    <div className="review-text">{review.review}</div>
                  </article>
                ))
              ) : (
                <div className="review-empty">There are no reviews for this tour yet.</div>
              )}
            </div>
          </section>
        </div>

        <aside className="book-card">
          <div className="bprice">
            {formatMoney(tour.price)} <small>/ person</small>
          </div>
          <div className="bdiv" />
          <div className="bmeta">
            <div className="brow">
              <span className="blabel">Difficulty</span>
              <span className="bval gold">{formatDifficulty(tour.difficulty)}</span>
            </div>
            <div className="brow">
              <span className="blabel">Duration</span>
              <span className="bval">{tour.duration} days</span>
            </div>
            <div className="brow">
              <span className="blabel">Group size</span>
              <span className="bval">{tour.maxGroupSize} guests</span>
            </div>
            <div className="brow">
              <span className="blabel">Starts from</span>
              <span className="bval">{tour.startLocation?.description ?? tour.region}</span>
            </div>
          </div>

          <div className="bfield-label">Select a date</div>
          <select className="bselect" value={startDate} onChange={(event) => setStartDate(event.target.value)}>
            {bookingDates.map((date) => (
              <option key={date} value={date}>
                {formatDate(date)}
              </option>
            ))}
          </select>

          <div className="bfield-label">Guests</div>
          <select
            className="bselect bselect-mb"
            value={String(guestCount)}
            onChange={(event) => setGuestCount(Number(event.target.value))}
          >
            {guestOptions.map((guest, index) => (
              <option key={guest} value={String(index + 1)}>
                {guest}
              </option>
            ))}
          </select>

          <div className="bfield-label">Payment method</div>
          <div className="payment-methods">
            <button
              className={`payment-method${paymentMethod === 'stripe' ? ' on' : ''}`}
              type="button"
              onClick={() => setPaymentMethod('stripe')}
            >
              Stripe
              <span>Card checkout</span>
            </button>
            <button
              className={`payment-method${paymentMethod === 'paystack' ? ' on' : ''}`}
              type="button"
              onClick={() => setPaymentMethod('paystack')}
            >
              Paystack
              <span>Local checkout</span>
            </button>
          </div>

          {bookingError ? <div className="booking-alert error">{bookingError}</div> : null}
          {bookingStatus ? <div className="booking-alert">{bookingStatus}</div> : null}

          <button className="btn-book" type="button" onClick={handleBookTour} disabled={bookingLoading}>
            {bookingLoading ? 'Preparing checkout...' : 'Book This Tour'}
          </button>
          <button className="btn-enq" type="button">
            Send an Enquiry
          </button>
          <div className="bnote">Free cancellation up to 7 days before. Pay in instalments available.</div>
        </aside>
      </section>

      <div className="mobile-book-bar">
        <div>
          <div className="mbb-price">
            {formatMoney(tour.price)} <small>/ person</small>
          </div>
          <div className="mbb-sub">
            {tour.rating ? `★ ${Number(tour.rating).toFixed(1)}` : '★ 4.9'} · {tour.duration} Days · Max {tour.maxGroupSize || 12}
          </div>
        </div>
        <button className="mbb-btn" type="button" onClick={handleBookTour} disabled={bookingLoading}>
          {bookingLoading ? 'Booking...' : 'Book Now'}
        </button>
      </div>
    </main>
  );
}
