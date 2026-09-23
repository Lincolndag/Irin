const AppError = require('../utils/appError');

const handleCastErrorDB = err =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateFieldsDB = err => {
  const value = err.keyValue ? JSON.stringify(err.keyValue) : 'duplicate value';
  return new AppError(
    `Duplicate field value: ${value}. Please use another value!`,
    400
  );
};

const handleValidationErrorDB = err => {
  const messages = Object.values(err.errors).map(el => el.message);
  return new AppError(`Invalid input data. ${messages.join('. ')}`, 400);
};

const sendErrorDev = (err, req, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack
  });
};

const sendErrorProd = (err, req, res) => {
  const isOperational = err.isOperational || err.OperationalError;

  if (isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }

  // Programming or unknown error: don't leak details
  // eslint-disable-next-line no-console
  console.error('ERROR 💥', err);

  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong'
  });
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again.', 401);

const handleJWTNotBeforeError = () =>
  new AppError('Token not yet valid. Please try again later.', 401);

module.exports = (err, req, res, next) => {
  let error = err;

  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  // Mongoose errors => AppError (operational)
  // Note: spreading errors can lose message/name; keep them explicitly
  if (error.name === 'CastError') error = handleCastErrorDB(error);
  if (error.code === 11000) error = handleDuplicateFieldsDB(error);
  if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
  if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError(error);
  if (error.name === 'NotBeforeError') error = handleJWTNotBeforeError(error);

  if (process.env.NODE_ENV === 'development') {
    return sendErrorDev(error, req, res);
  }

  return sendErrorProd(error, req, res);
};

