import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ContentPage from '../../components/ContentPage/ContentPage';
import { fetchBookingById, resolveBackendImageUrl } from '../../utils/api';
import heroFallback from '../../assets/hero.png';
import './BookingSuccessPage.css';

function formatMoney(value, currency) {
  const amount = Number(value ?? 0);
  const code = String(currency || 'USD').trim().toUpperCase();

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0,
    }).format(Number.isFinite(amount) ? amount : 0);
  } catch {
    return `${Number.isFinite(amount) ? amount : 0} ${code}`;
  }
}

function formatDate(value) {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export default function BookingSuccessPage() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking');
  const provider = (searchParams.get('provider') || '').toLowerCase();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    let active = true;
    let timerId = null;

    const stopPolling = () => {
      if (timerId) {
        window.clearInterval(timerId);
        timerId = null;
      }
    };

    const loadBooking = async () => {
      if (!bookingId) {
        setError('We could not read the booking reference from the URL.');
        setLoading(false);
        stopPolling();
        return;
      }

      try {
        const response = await fetchBookingById(bookingId);
        if (!active) return;

        const currentBooking = response?.data?.booking ?? response?.booking ?? null;
        setBooking(currentBooking);
        setError('');

        if (currentBooking?.status === 'paid') {
          setLoading(false);
          stopPolling();
        } else {
          setLoading(false);
          if (!timerId) {
            timerId = window.setInterval(loadBooking, 4000);
          }
        }
      } catch (err) {
        if (!active) return;
        setError(err.message || 'We could not load the booking yet.');
        setLoading(false);
        stopPolling();
      }
    };

    loadBooking();

    return () => {
      active = false;
      stopPolling();
    };
  }, [bookingId]);

  const tour = booking?.tour ?? null;
  const image = useMemo(
    () => resolveBackendImageUrl(tour?.imageCover, heroFallback),
    [tour?.imageCover],
  );
  const status = booking?.status || 'pending';
  const paid = status === 'paid';
  const currency = booking?.currency || 'USD';
  const total = booking?.amount ?? tour?.price ?? 0;
  const guests = booking?.guests ?? 1;

  if (loading && !booking) {
    return (
      <ContentPage
        eyebrow="Booking"
        title="Checking your booking"
        intro="We are reading the booking record created on the backend and waiting for the webhook to confirm payment."
        image={image}
        ctaLabel="Back to tours"
        ctaTo="/tours"
        muted
      >
        <div className="booking-shell">
          <div className="booking-card">Loading booking status...</div>
        </div>
      </ContentPage>
    );
  }

  if (error && !booking) {
    return (
      <ContentPage
        eyebrow="Booking"
        title="Booking status needs attention"
        intro="The booking page loaded, but we could not read the saved booking yet."
        image={image}
        ctaLabel="Browse tours"
        ctaTo="/tours"
        muted
      >
        <div className="booking-shell">
          <div className="booking-card">
            <div className="booking-status pending">Pending confirmation</div>
            <p className="booking-copy">{error}</p>
            <div className="booking-actions">
              <Link className="booking-link" to="/tours">
                Return to tours
              </Link>
              {bookingId ? <span className="booking-ref">Booking: {bookingId}</span> : null}
            </div>
          </div>
        </div>
      </ContentPage>
    );
  }

  return (
    <ContentPage
      eyebrow="Booking"
      title={paid ? 'Your tour is confirmed' : 'Booking received'}
      intro={
        paid
          ? 'The payment webhook has updated your booking and the trip is now confirmed.'
          : 'Your booking was saved. We are still waiting for the payment webhook to confirm the transaction.'
      }
      image={image}
      ctaLabel="Explore more tours"
      ctaTo="/tours"
      muted
    >
      <div className="booking-shell">
        <div className="booking-card">
          <div className={`booking-status ${paid ? 'paid' : 'pending'}`}>
            {paid ? 'Payment confirmed' : 'Awaiting webhook confirmation'}
          </div>

          <div className="booking-grid">
            <div className="booking-copy-wrap">
              <h2>{tour?.name || 'Selected tour'}</h2>
              <p className="booking-copy">
                {paid
                  ? 'Your spot has been secured. The backend marked this booking as paid after receiving the provider webhook.'
                  : 'The booking exists, but the provider webhook has not confirmed payment yet. This page will refresh the status automatically.'}
              </p>
              <div className="booking-meta">
                <div>
                  <span>Guests</span>
                  <strong>{guests}</strong>
                </div>
                <div>
                  <span>Start date</span>
                  <strong>{formatDate(booking?.startDate)}</strong>
                </div>
                <div>
                  <span>Amount</span>
                  <strong>{formatMoney(total, currency)}</strong>
                </div>
                <div>
                  <span>Provider</span>
                  <strong>{booking?.provider || provider || 'stripe'}</strong>
                </div>
              </div>
            </div>

            <div className="booking-summary">
              <img
                className="booking-image"
                src={resolveBackendImageUrl(tour?.imageCover, image)}
                alt={tour?.name || 'Tour image'}
              />
              <div className="booking-rows">
                <div className="booking-row">
                  <span>Booking ID</span>
                  <strong>{booking?._id || bookingId}</strong>
                </div>
                <div className="booking-row">
                  <span>Status</span>
                  <strong>{status}</strong>
                </div>
                <div className="booking-row">
                  <span>Reference</span>
                  <strong>{booking?.providerReference || 'Waiting for webhook'}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ContentPage>
  );
}
