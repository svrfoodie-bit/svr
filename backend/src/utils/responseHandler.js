// Standardized API response handler

const success = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const error = (res, message = 'Error occurred', statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors })
  });
};

const created = (res, data, message = 'Resource created successfully') => {
  return success(res, data, message, 201);
};

const updated = (res, data, message = 'Resource updated successfully') => {
  return success(res, data, message, 200);
};

const deleted = (res, message = 'Resource deleted successfully') => {
  return success(res, null, message, 200);
};

const notFound = (res, message = 'Resource not found') => {
  return error(res, message, 404);
};

const badRequest = (res, message = 'Bad request', errors = null) => {
  return error(res, message, 400, errors);
};

const unauthorized = (res, message = 'Unauthorized access') => {
  return error(res, message, 401);
};

const forbidden = (res, message = 'Access forbidden') => {
  return error(res, message, 403);
};

module.exports = {
  success,
  error,
  created,
  updated,
  deleted,
  notFound,
  badRequest,
  unauthorized,
  forbidden
};
