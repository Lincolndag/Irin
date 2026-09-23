import { useEffect, useMemo, useState } from 'react';
import TourCard from '../../components/TourCard/TourCard';
import { API_ROOT } from '../../utils/api';
import './ToursPage.css';

// Use the IRIN head image from public/img (relative to /public for React public assets)
const HERO_IMAGE = '/img/irinhead.jpeg';

const SORT_OPTIONS = [
  { value: 'rating-desc', label: 'Highest rated' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'duration-asc', label: 'Duration: shortest' },
  { value: 'duration-desc', label: 'Duration: longest' },
  { value: 'name-asc', label: 'Name: A–Z' },
];

function normalizeTour(tour) {
  return {
    id: tour.id ?? tour._id ?? '',
    name: tour.name ?? 'Untitled tour',
    description: tour.description ?? '',
    price: tour.price ?? 0,
    image: tour.imageCover ?? tour.image ?? '',
    region:
      tour.startLocation?.description ??
      tour.region ??
      tour.location ??
      'Featured journey',
    rating: tour.ratingsAverage ?? tour.rating ?? 0,
    reviews: tour.ratingsQuantity ?? tour.reviews ?? 0,
    duration: tour.durations ?? tour.duration ?? 0,
    maxGroup: tour.maxGroupSize ?? tour.maxGroup ?? 0,
    difficulty: tour.difficulty ?? 'moderate',
    summary: tour.summary ?? tour.description ?? '',
  };
}

function matchesSearch(tour, query) {
  if (!query) return true;

  const haystack = [tour.name, tour.description, tour.summary, tour.region]
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
}

function sortTours(tours, sort) {
  const sorted = [...tours];

  switch (sort) {
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price);
    case 'duration-asc':
      return sorted.sort((a, b) => a.duration - b.duration);
    case 'duration-desc':
      return sorted.sort((a, b) => b.duration - a.duration);
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'rating-desc':
    default:
      return sorted.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
  }
}

export default function ToursPage() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [region, setRegion] = useState('all');
  const [sort, setSort] = useState('rating-desc');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function fetchTours() {
      setLoading(true);
      setError('');

      try {
        const res = await fetch(`${API_ROOT}/tours`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error('Failed to load tours');
        }

        const json = await res.json();
        setTours(json.data.data.map(normalizeTour));
      } catch (err) {
        if (err?.name === 'AbortError') return;
        setError(err?.message || 'Failed to load tours');
      } finally {
        if (controller.signal.aborted) return;
        setLoading(false);
      }
    }

    fetchTours();

    return () => {
      controller.abort();
    };
  }, []);

  const difficulties = useMemo(
    () =>
      [...new Set(tours.map((tour) => tour.difficulty).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [tours],
  );

  const regions = useMemo(
    () =>
      [...new Set(tours.map((tour) => tour.region).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [tours],
  );

  const priceLimits = useMemo(() => {
    if (!tours.length) return [];

    const maxTourPrice = Math.max(...tours.map((tour) => tour.price));
    const steps = [500, 1000, 1500, 2000, 2500, 3000, 5000].filter(
      (value) => value < maxTourPrice,
    );

    return [...steps, Math.ceil(maxTourPrice)];
  }, [tours]);

  const visibleTours = useMemo(() => {
    const query = search.trim().toLowerCase();
    const priceCap = maxPrice ? Number(maxPrice) : null;

    const filtered = tours.filter((tour) => {
      if (!matchesSearch(tour, query)) return false;
      if (difficulty !== 'all' && tour.difficulty !== difficulty) return false;
      if (region !== 'all' && tour.region !== region) return false;
      if (priceCap !== null && !Number.isNaN(priceCap) && tour.price > priceCap) return false;
      return true;
    });

    return sortTours(filtered, sort);
  }, [tours, search, difficulty, region, sort, maxPrice]);

  const hasActiveFilters =
    search.trim() !== '' ||
    difficulty !== 'all' ||
    region !== 'all' ||
    maxPrice !== '' ||
    sort !== 'rating-desc';

  const clearFilters = () => {
    setSearch('');
    setDifficulty('all');
    setRegion('all');
    setSort('rating-desc');
    setMaxPrice('');
  };

  // Gold styling for toolbar text and inputs
  const toolbarGoldStyle = { color: 'var(--gold)', fontWeight: 500 };
  const inputGoldStyle = {
    color: 'var(--gold)',
    borderColor: 'var(--gold)',
    background: 'rgba(201, 169, 110, 0.07)',
    fontWeight: 500,
  };

  return (
    <main>
      <div className="page-hero" style={{ '--hero-image': `url(${HERO_IMAGE})` }}>
        <div className="eyebrow">
          <div className="eyeline" />
          <span>Tours</span>
        </div>
        <h1>Browse curated travel experiences</h1>
        <p style={{ color: 'var(--gold)' }}>
          Search by name or region, filter by difficulty and price, and sort results to find the right trip faster.
        </p>
      </div>

      <section className="tours-main">
        {!loading && !error && tours.length > 0 ? (
          <div className="tours-toolbar">
            <label className="tours-search" style={toolbarGoldStyle}>
              <span className="sr-only">Search tours</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tours, regions, keywords..."
                style={inputGoldStyle}
                className="gold-placeholder"
              />
            </label>

            <div className="tours-controls">
              <label className="tours-control" style={toolbarGoldStyle}>
                <span style={{ color: 'var(--gold)', fontWeight: 500 }}>Difficulty</span>
                <select
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value)}
                  style={inputGoldStyle}
                >
                  <option value="all">All levels</option>
                  {difficulties.map((level) => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="tours-control" style={toolbarGoldStyle}>
                <span style={{ color: 'var(--gold)', fontWeight: 500 }}>Region</span>
                <select
                  value={region}
                  onChange={(event) => setRegion(event.target.value)}
                  style={inputGoldStyle}
                >
                  <option value="all">All regions</option>
                  {regions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="tours-control" style={toolbarGoldStyle}>
                <span style={{ color: 'var(--gold)', fontWeight: 500 }}>Max price</span>
                <select
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                  style={inputGoldStyle}
                >
                  <option value="">Any price</option>
                  {priceLimits.map((value) => (
                    <option key={value} value={String(value)}>
                      Up to ${value.toLocaleString()}
                    </option>
                  ))}
                </select>
              </label>

              <label className="tours-control" style={toolbarGoldStyle}>
                <span style={{ color: 'var(--gold)', fontWeight: 500 }}>Sort by</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  style={inputGoldStyle}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="tours-toolbar-meta">
              <p className="tours-count" style={toolbarGoldStyle}>
                Showing {visibleTours.length} of {tours.length} tour{tours.length === 1 ? '' : 's'}
              </p>
              {hasActiveFilters ? (
                <button className="tours-clear" type="button" onClick={clearFilters}>
                  Clear filters
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {loading && <div className="tours-loading">Loading tours...</div>}
        {error && <div className="tours-error">Error: {error}</div>}
        {!loading && !error && tours.length === 0 ? (
          <div className="tours-empty">No tours found</div>
        ) : null}
        {!loading && !error && tours.length > 0 && visibleTours.length === 0 ? (
          <div className="tours-empty">
            No tours match your filters.{' '}
            <button className="tours-clear inline" type="button" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        ) : null}
        {!loading && !error && visibleTours.length > 0 ? (
          <div className="tours-grid">
            {visibleTours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

// Add this style to ensure placeholder text is gold. (You would add this to ToursPage.css ideally.)
/*
.gold-placeholder::placeholder {
  color: var(--gold) !important;
  opacity: 1;
}
*/
