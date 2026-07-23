const Document = require('../models/Document');
const Employee = require('../models/Employee');
const ApiResponse = require('../utils/apiResponse');
const { createError } = require('../utils/helpers');

const getDocuments = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { employeeId, type, isVerified } = req.query;
    let query = {};
    if (req.user.role === 'employee') {
      const emp = await Employee.findOne({ user: req.user._id });
      if (emp) query.employee = emp._id;
    } else if (employeeId) query.employee = employeeId;
    if (type) query.type = type;
    if (isVerified !== undefined) query.isVerified = isVerified === 'true';
    const [documents, total] = await Promise.all([
      Document.find(query).populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName' } }).populate('verifiedBy', 'firstName lastName').skip(skip).limit(limit).sort({ createdAt: -1 }),
      Document.countDocuments(query)
    ]);
    ApiResponse.paginated(res, documents, total, page, limit);
  } catch (err) { next(err); }
};

const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) return next(createError('No file uploaded', 400));
    let employee;
    if (req.user.role === 'employee') employee = await Employee.findOne({ user: req.user._id });
    else employee = await Employee.findById(req.body.employeeId);
    if (!employee) return next(createError('Employee not found', 404));
    const doc = await Document.create({
      employee: employee._id,
      title: req.body.title,
      type: req.body.type || 'other',
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/documents/${req.file.filename}`,
      path: req.file.path,
      description: req.body.description,
      expiryDate: req.body.expiryDate,
      isConfidential: req.body.isConfidential,
      createdBy: req.user._id
    });
    await Employee.findByIdAndUpdate(employee._id, { $push: { documents: doc._id } });
    ApiResponse.created(res, doc, 'Document uploaded');
  } catch (err) { next(err); }
};

const verifyDocument = async (req, res, next) => {
  try {
    const doc = await Document.findByIdAndUpdate(req.params.id, { isVerified: true, verifiedBy: req.user._id, verifiedAt: new Date() }, { new: true });
    if (!doc) return next(createError('Document not found', 404));
    ApiResponse.success(res, doc, 'Document verified');
  } catch (err) { next(err); }
};

const deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findByIdAndDelete(req.params.id);
    if (!doc) return next(createError('Document not found', 404));
    await Employee.findByIdAndUpdate(doc.employee, { $pull: { documents: doc._id } });
    ApiResponse.success(res, null, 'Document deleted');
  } catch (err) { next(err); }
};

module.exports = { getDocuments, uploadDocument, verifyDocument, deleteDocument };
