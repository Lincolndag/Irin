const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');


// Load environment variables BEFORE accessing process.env
dotenv.config({ path: './config.env' });
const DB = process.env.DATABASE_LOCAL;

const app = express();

const escapeHtml = value =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

const sanitizeValue = value => {
  if (typeof value === 'string') return escapeHtml(value);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, sanitizeValue(nestedValue)])
    );
  }
  return value;
};

const sanitizeQuery = query => {
  if (!query || typeof query !== 'object') return;
  for (const key of Object.keys(query)) {
    query[key] = sanitizeValue(query[key]);
  }
};

// Middleware
app.use(helmet());
app.use((req, res, next) => {
  const allowedOrigins = new Set([
    'http://localhost:5173',
    'http://localhost:5174',
  ]);
  const origin = req.headers.origin;

  if (allowedOrigins.has(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

const limiter = rateLimit({
  max: 100,            
  windowMs: 60 * 60 * 1000, // 1 hour window
  message: 'Too many requests from this IP, please try again in an hour'
});

app.use('/api', limiter); // applies to all /api routes

// Routes
const tourRouter = require('./Router/tourRoutes');
const userRouter = require('./Router/userRoutes');
const bookingRouter = require('./Router/bookingRoutes');
const bookingController = require('./controllers/bookingController');
const reviewRouter = require('./Router/reviewRoutes');

app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(req.method, req.originalUrl);
  }
  next();
});

app.post(
  '/api/v1/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  bookingController.handleStripeWebhook,
);

app.post(
  '/api/v1/webhooks/paystack',
  express.raw({ type: 'application/json' }),
  bookingController.handlePaystackWebhook,
);

app.use(express.json());  // Parse JSON request bodies
app.use(mongoSanitize()); // must be after express.json()
app.use('/img', express.static(path.join(__dirname, 'public', 'img')));
app.use((req, res, next) => {
  if (req.body) req.body = sanitizeValue(req.body);
  sanitizeQuery(req.query);
  next();
});
app.use(hpp({
  whitelist: ['duration', 'ratingsAverage', 'ratingsQuantity', 'maxGroupSize', 'difficulty', 'price']
}));
app.use(cookieParser());
app.use(morgan('dev'));   // Log HTTP requests in development

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1', bookingRouter);
app.use('/api/v1/reviews', reviewRouter);

// 404 handler - must be after all routes
app.use((req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Global error handler (needed for asyncHandler -> next(err))
app.use(globalErrorHandler);

const port = process.env.PORT || 3000;

// Database connection (requires MongoDB to be running)
mongoose.connect(DB)
  .then(() => {
    console.log('DB connection successful!');
    app.listen(port, () => {
      console.log(`App running on port ${port}...`);
    });
  })
  .catch(err => {
    console.log('ERROR:', err);
    process.exit(1);
  });
