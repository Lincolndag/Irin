// Custom error class for operational errors

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // Captures stack trace but excludes constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
