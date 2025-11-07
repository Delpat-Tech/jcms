/**
 * Standardized API response handler
 */

const success = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

const error = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (errors && process.env.NODE_ENV !== 'production') {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

const paginated = (res, data, page, limit, total) => {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    },
    timestamp: new Date().toISOString()
  });
};

module.exports = { success, error, paginated };
