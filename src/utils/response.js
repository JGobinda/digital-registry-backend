/**
 * Send a standardised success response
 */
const sendSuccess = (res, { statusCode = 200, message = "Success", data = null, pagination = null } = {}) => {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  if (pagination) body.pagination = pagination;
  return res.status(statusCode).json(body);
};

/**
 * Send a standardised error response
 */
const sendError = (res, { statusCode = 500, message = "Internal Server Error", errors = null } = {}) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

/**
 * Build pagination metadata from query results
 */
const buildPagination = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

module.exports = { sendSuccess, sendError, buildPagination };
