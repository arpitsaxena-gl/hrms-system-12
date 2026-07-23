class ApiResponse {
  static success(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({ success: true, message, data });
  }
  static created(res, data, message = 'Created successfully') {
    return res.status(201).json({ success: true, message, data });
  }
  static paginated(res, data, total, page, limit, message = 'Success') {
    return res.status(200).json({
      success: true, message, data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPrevPage: page > 1 }
    });
  }
  static error(res, message = 'Error', statusCode = 500, errors = null) {
    return res.status(statusCode).json({ success: false, message, ...(errors && { errors }) });
  }
  static notFound(res, resource = 'Resource') {
    return res.status(404).json({ success: false, message: `${resource} not found` });
  }
  static unauthorized(res, message = 'Unauthorized') {
    return res.status(401).json({ success: false, message });
  }
  static forbidden(res, message = 'Forbidden') {
    return res.status(403).json({ success: false, message });
  }
}
module.exports = ApiResponse;
