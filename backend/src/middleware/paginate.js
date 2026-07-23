const paginate = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 10, 100);
  const skip = (page - 1) * limit;
  req.pagination = { page, limit, skip };
  next();
};

module.exports = paginate;
