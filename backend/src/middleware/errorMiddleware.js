// Error Handling Middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Database errors
  if (err.code === '23505') {
    // Unique constraint violation
    statusCode = 409;
    message = 'Resource already exists';
  } else if (err.code === '23503') {
    // Foreign key constraint violation
    statusCode = 400;
    message = 'Invalid reference to related resource';
  } else if (err.code === '23502') {
    // NOT NULL violation
    statusCode = 400;
    message = 'Required field is missing';
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found'
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
