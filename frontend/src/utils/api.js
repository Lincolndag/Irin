const DEFAULT_API_ROOT = '/api/v1';
const DEFAULT_BACKEND_ORIGIN = 'http://localhost:4000';

export const API_ROOT = import.meta.env.VITE_API_ROOT || DEFAULT_API_ROOT;
export const BACKEND_ORIGIN = (() => {
  const configuredOrigin =
    import.meta.env.VITE_BACKEND_ORIGIN ||
    import.meta.env.VITE_API_ORIGIN ||
    '';

  if (configuredOrigin) {
    return configuredOrigin.replace(/\/$/, '');
  }

  if (/^https?:\/\//i.test(API_ROOT)) {
    return new URL(API_ROOT).origin;
  }

  return DEFAULT_BACKEND_ORIGIN;
})();

export function resolveBackendImageUrl(src, fallback = '') {
  if (!src) return fallback;

  const value = String(src).trim();
  if (!value) return fallback;

  if (value.startsWith('//')) {
    return `https:${value}`;
  }

  if (/^(?:https?:)?\/\//i.test(value) || /^(?:blob:|data:|file:)/i.test(value)) {
    return value;
  }

  if (value.startsWith('/img/users/') || value.startsWith('/img/tours/')) {
    return `${BACKEND_ORIGIN}${value}`;
  }

  if (/^[\w-]+(?:\.[\w-]+)+\/.+/i.test(value)) {
    return `https://${value}`;
  }

  if (!value.includes('/') && /\.(?:avif|bmp|gif|jpe?g|png|svg|webp)$/i.test(value)) {
    return `${BACKEND_ORIGIN}/img/tours/${value}`;
  }

  return value;
}

async function request(path, options = {}) {
  const { headers = {}, body, ...rest } = options;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const response = await fetch(`${API_ROOT}${path}`, {
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body,
    ...rest,
  });

  const text = await response.text();
  let payload = {};

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error?.message || 'Request failed');
  }

  return payload;
}

export function signupUser(name, email, password, passwordConfirm) {
  return request('/users/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, passwordConfirm }),
  });
}

export function loginUser(email, password) {
  return request('/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function logoutUser() {
  return request('/users/logout', {
    method: 'POST',
  });
}

export function fetchCurrentUser() {
  return request('/users/me', {
    method: 'GET',
  });
}

export function updateMe(input, maybeEmail, maybePhoto) {
  const payload =
    input && typeof input === 'object' && !(input instanceof FormData)
      ? input
      : { name: input, email: maybeEmail, photo: maybePhoto };

  const body = new FormData();

  if (payload.name !== undefined) body.append('name', payload.name);
  if (payload.email !== undefined) body.append('email', payload.email);
  if (payload.photo) body.append('photo', payload.photo);

  return request('/users/updateMe', {
    method: 'PATCH',
    body,
  });
}

export function deleteMe() {
  return request('/users/deleteMe', {
    method: 'DELETE',
  });
}

export function createTourBooking(tourId, payload) {
  return request(`/tours/${tourId}/bookings`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchBookingById(bookingId) {
  return request(`/bookings/${bookingId}`, {
    method: 'GET',
  });
}

export function verifyBookingPayment(bookingId, payload = {}) {
  const params = new URLSearchParams();

  if (payload.provider) params.set('provider', payload.provider);
  if (payload.sessionId) params.set('session_id', payload.sessionId);
  if (payload.reference) params.set('reference', payload.reference);

  const query = params.toString();

  return request(`/bookings/${bookingId}/verify${query ? `?${query}` : ''}`, {
    method: 'GET',
  });
}
