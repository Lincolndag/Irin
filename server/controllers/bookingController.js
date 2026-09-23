const crypto = require('crypto');
const Tour = require('../Model/tourModel');
const User = require('../Model/userModel');
const Booking = require('../Model/bookingModel');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');

const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

const SUPPORTED_METHODS = new Set(['stripe', 'paystack']);

const getCurrencyExponent = currency => {
  const normalized = String(currency || '').trim().toUpperCase();

  if (normalized === 'JPY') return 0;
  return 2;
};

const toMinorUnits = (amount, currency) => {
  const exponent = getCurrencyExponent(currency);
  return Math.round(Number(amount) * 10 ** exponent);
};

const cleanPaymentMethod = paymentMethod =>
  String(paymentMethod || '').trim().toLowerCase();

const createReturnUrl = (bookingId, provider, params = {}) => {
  const url = new URL('/booking/success', FRONTEND_URL);
  url.searchParams.set('booking', bookingId);
  url.searchParams.set('provider', provider);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
};

const getRawBody = req => {
  if (Buffer.isBuffer(req.body)) {
    return req.body.toString('utf8');
  }

  if (typeof req.body === 'string') {
    return req.body;
  }

  return '';
};

const ensureEnv = (value, name) => {
  if (!value) {
    throw new AppError(`${name} is not configured`, 500);
  }
  return value;
};

const resolveProviderCurrency = provider => {
  if (provider === 'stripe') {
    return (process.env.STRIPE_CURRENCY || process.env.PAYMENT_CURRENCY || 'usd')
      .trim()
      .toLowerCase();
  }

  return (process.env.PAYSTACK_CURRENCY || process.env.PAYMENT_CURRENCY || 'ngn')
    .trim()
    .toUpperCase();
};

const buildAmount = (tour, guests, provider) => {
  const price = Number(tour.priceDiscount || tour.price || 0);
  const guestCount = Number(guests || 1);
  const currency = resolveProviderCurrency(provider);
  const total = price * guestCount;

  return {
    guestCount,
    currency,
    total,
    minorUnits: toMinorUnits(total, currency),
  };
};

const formatWebhookEvent = payload => {
  if (!payload) return null;
  if (Buffer.isBuffer(payload)) {
    const text = payload.toString('utf8');
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload);
    } catch {
      return null;
    }
  }

  return payload;
};

const stripeSignatureIsValid = (rawBody, signatureHeader) => {
  const endpointSecret = STRIPE_WEBHOOK_SECRET;
  if (!endpointSecret || !rawBody || !signatureHeader) return false;

  const parts = String(signatureHeader)
    .split(',')
    .map(part => part.trim())
    .reduce((acc, part) => {
      const [key, value] = part.split('=');
      if (!key || !value) return acc;
      acc[key] = acc[key] || [];
      acc[key].push(value);
      return acc;
    }, {});

  const timestamp = parts.t?.[0];
  const signatures = parts.v1 || [];

  if (!timestamp || signatures.length === 0) return false;

  const expected = crypto
    .createHmac('sha256', endpointSecret)
    .update(`${timestamp}.${rawBody}`, 'utf8')
    .digest('hex');

  return signatures.some(signature => {
    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  });
};

const updateBookingFromWebhook = async ({ bookingId, provider, reference, providerSessionId, payload }) => {
  if (!bookingId) return null;

  const booking = await Booking.findById(bookingId);
  if (!booking) return null;

  booking.provider = provider || booking.provider;
  booking.providerReference = reference || booking.providerReference;
  booking.providerSessionId = providerSessionId || booking.providerSessionId;
  booking.paymentPayload = payload;
  booking.verifiedAt = new Date();
  booking.status = 'paid';
  booking.paidAt = new Date();

  await booking.save({ validateBeforeSave: false });
  return booking;
};

const createStripeCheckout = async ({ booking, tour, user, guestCount, currency, total }) => {
  const secret = ensureEnv(STRIPE_SECRET_KEY, 'STRIPE_SECRET_KEY');
  const payload = new URLSearchParams();
  payload.append('mode', 'payment');
  payload.append(
    'success_url',
    createReturnUrl(booking._id.toString(), 'stripe', {
      session_id: '{CHECKOUT_SESSION_ID}',
    }),
  );
  payload.append(
    'cancel_url',
    `${FRONTEND_URL}/tours/${tour._id}?booking=cancelled&provider=stripe`,
  );
  payload.append('customer_email', user.email);
  payload.append('client_reference_id', booking._id.toString());
  payload.append('metadata[bookingId]', booking._id.toString());
  payload.append('metadata[tourId]', tour._id.toString());
  payload.append('metadata[userId]', user._id.toString());
  payload.append('metadata[guests]', String(guestCount));
  payload.append('metadata[startDate]', booking.startDate.toISOString());
  payload.append('line_items[0][price_data][currency]', currency);
  payload.append('line_items[0][price_data][product_data][name]', tour.name);
  payload.append(
    'line_items[0][price_data][product_data][description]',
    `${guestCount} guest${guestCount > 1 ? 's' : ''} · ${tour.durations} day tour`,
  );
  payload.append(
    'line_items[0][price_data][unit_amount]',
    String(Math.max(0, Math.round(total * 10 ** getCurrencyExponent(currency)))),
  );
  payload.append('line_items[0][quantity]', '1');

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new AppError(data?.error?.message || data?.message || 'Unable to create Stripe checkout session', 502);
  }

  return {
    paymentUrl: data.url,
    providerSessionId: data.id,
    providerReference: data.id,
    payload: data,
  };
};

const createPaystackCheckout = async ({ booking, tour, user, guestCount, currency, minorUnits, total }) => {
  const secret = ensureEnv(PAYSTACK_SECRET_KEY, 'PAYSTACK_SECRET_KEY');
  const reference = `irin_${booking._id.toString()}_${crypto.randomBytes(4).toString('hex')}`;

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      amount: String(Math.max(0, minorUnits)),
      currency,
      reference,
      callback_url: createReturnUrl(booking._id.toString(), 'paystack'),
      metadata: {
        bookingId: booking._id.toString(),
        tourId: tour._id.toString(),
        userId: user._id.toString(),
        guests: guestCount,
        startDate: booking.startDate.toISOString(),
        total,
      },
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data?.status === false) {
    throw new AppError(data?.message || 'Unable to create Paystack transaction', 502);
  }

  return {
    paymentUrl: data?.data?.authorization_url,
    providerSessionId: data?.data?.access_code,
    providerReference: data?.data?.reference || reference,
    payload: data,
  };
};

exports.bookTour = asyncHandler(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError('No user found for the current session', 404));
  }

  const paymentMethod = cleanPaymentMethod(req.body.paymentMethod || 'stripe');
  if (!SUPPORTED_METHODS.has(paymentMethod)) {
    return next(new AppError('Choose either stripe or paystack for payment', 400));
  }

  const { guestCount, currency, total, minorUnits } = buildAmount(
    tour,
    req.body.guests,
    paymentMethod,
  );

  if (!Number.isFinite(guestCount) || guestCount < 1) {
    return next(new AppError('Please choose at least one guest', 400));
  }

  if (tour.maxGroupSize && guestCount > tour.maxGroupSize) {
    return next(
      new AppError(
        `This tour allows a maximum of ${tour.maxGroupSize} guest${tour.maxGroupSize === 1 ? '' : 's'}`,
        400,
      ),
    );
  }

  const startDate = req.body.startDate ? new Date(req.body.startDate) : new Date(tour.startDates?.[0] || Date.now());
  if (Number.isNaN(startDate.getTime())) {
    return next(new AppError('Please provide a valid start date', 400));
  }

  const booking = await Booking.create({
    tour: tour._id,
    user: user._id,
    startDate,
    guests: guestCount,
    paymentMethod,
    provider: paymentMethod,
    currency,
    amount: total,
    status: 'pending',
  });

  const checkout =
    paymentMethod === 'stripe'
      ? await createStripeCheckout({ booking, tour, user, guestCount, currency, total })
      : await createPaystackCheckout({
          booking,
          tour,
          user,
          guestCount,
          currency,
          minorUnits,
          total,
        });

  booking.providerSessionId = checkout.providerSessionId;
  booking.providerReference = checkout.providerReference;
  booking.paymentUrl = checkout.paymentUrl;
  booking.paymentPayload = checkout.payload;
  await booking.save({ validateBeforeSave: false });

  res.status(201).json({
    status: 'success',
    data: {
      booking,
      paymentUrl: checkout.paymentUrl,
      provider: paymentMethod,
    },
  });
});

exports.getBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.bookingId).populate(
    'tour',
    'name price imageCover duration durations startDates maxGroupSize summary description',
  );

  if (!booking) {
    return next(new AppError('No booking found with that ID', 404));
  }

  const bookingUserId = booking.user?.toString?.() || booking.user?._id?.toString?.();
  const currentUserId = req.user?._id?.toString?.();

  if (req.user?.role !== 'admin' && bookingUserId !== currentUserId) {
    return next(new AppError('You are not allowed to view this booking', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      booking,
    },
  });
});

exports.verifyBookingPayment = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.bookingId);

  if (!booking) {
    return next(new AppError('No booking found with that ID', 404));
  }

  const provider = cleanPaymentMethod(req.query.provider || booking.provider);
  if (!SUPPORTED_METHODS.has(provider)) {
    return next(new AppError('Choose either stripe or paystack for verification', 400));
  }

  let verification;

  if (provider === 'stripe') {
    const secret = ensureEnv(STRIPE_SECRET_KEY, 'STRIPE_SECRET_KEY');
    const sessionId = req.query.session_id || req.query.sessionId || booking.providerSessionId;

    if (!sessionId) {
      return next(new AppError('Missing Stripe session ID', 400));
    }

    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${secret}`,
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new AppError(data?.error?.message || 'Unable to verify Stripe payment', 502);
    }

    verification = {
      status: data.payment_status === 'paid' || data.status === 'complete',
      payload: data,
      reference: data.id,
    };
  } else {
    const secret = ensureEnv(PAYSTACK_SECRET_KEY, 'PAYSTACK_SECRET_KEY');
    const reference = req.query.reference || req.query.trxref || booking.providerReference;

    if (!reference) {
      return next(new AppError('Missing Paystack reference', 400));
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${secret}`,
        },
      },
    );

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.status === false) {
      throw new AppError(data?.message || 'Unable to verify Paystack payment', 502);
    }

    verification = {
      status: data?.data?.status === 'success',
      payload: data,
      reference,
    };
  }

  booking.verifiedAt = new Date();
  booking.providerReference = verification.reference || booking.providerReference;
  booking.providerSessionId =
    booking.providerSessionId || verification.payload?.id || verification.payload?.data?.access_code;

  if (verification.status) {
    booking.status = 'paid';
    booking.paidAt = new Date();
  }

  booking.paymentPayload = verification.payload;
  await booking.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    data: {
      booking,
      paid: verification.status,
      provider,
    },
  });
});

exports.handleStripeWebhook = asyncHandler(async (req, res) => {
  const rawBody = getRawBody(req);
  const signatureHeader = req.headers['stripe-signature'];

  if (!stripeSignatureIsValid(rawBody, signatureHeader)) {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid Stripe webhook signature',
    });
  }

  const event = formatWebhookEvent(rawBody);
  if (!event) {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid Stripe webhook payload',
    });
  }

  const eventType = event.type;
  const session = event.data?.object || {};

  if (
    eventType === 'checkout.session.completed' ||
    eventType === 'checkout.session.async_payment_succeeded'
  ) {
    const bookingId = session.metadata?.bookingId || session.client_reference_id;
    await updateBookingFromWebhook({
      bookingId,
      provider: 'stripe',
      reference: session.id,
      providerSessionId: session.id,
      payload: event,
    });
  }

  return res.status(200).json({ received: true });
});

exports.handlePaystackWebhook = asyncHandler(async (req, res) => {
  const rawBody = getRawBody(req);
  const signatureHeader = req.headers['x-paystack-signature'];
  const secret = PAYSTACK_SECRET_KEY;

  if (!secret) {
    return res.status(500).json({
      status: 'fail',
      message: 'PAYSTACK_SECRET_KEY is not configured',
    });
  }

  const expected = crypto.createHmac('sha512', secret).update(rawBody, 'utf8').digest('hex');

  try {
    if (
      !signatureHeader ||
      !crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected))
    ) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid Paystack webhook signature',
      });
    }
  } catch {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid Paystack webhook signature',
    });
  }

  const event = formatWebhookEvent(rawBody);
  if (!event) {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid Paystack webhook payload',
    });
  }

  if (event.event === 'charge.success' || event.event === 'transaction.success') {
    const payload = event.data || {};
    const bookingId =
      payload.metadata?.bookingId ||
      payload.metadata?.booking_id ||
      payload.reference?.match?.(/irin_([a-f0-9]{24})_/i)?.[1] ||
      null;

    await updateBookingFromWebhook({
      bookingId,
      provider: 'paystack',
      reference: payload.reference,
      providerSessionId: payload.access_code,
      payload: event,
    });
  }

  return res.status(200).json({ received: true });
});
