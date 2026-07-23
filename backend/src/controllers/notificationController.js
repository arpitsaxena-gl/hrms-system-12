const Notification = require('../models/Notification');
const ApiResponse = require('../utils/apiResponse');
const { createError } = require('../utils/helpers');

const getNotifications = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const { isRead, category } = req.query;
    let query = { recipient: req.user._id };
    if (isRead !== undefined) query.isRead = isRead === 'true';
    if (category) query.category = category;
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query).populate('sender', 'firstName lastName avatar').skip(skip).limit(limit).sort({ createdAt: -1 }),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: req.user._id, isRead: false })
    ]);
    ApiResponse.paginated(res, { notifications, unreadCount }, total, page, limit);
  } catch (err) { next(err); }
};

const markAsRead = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (ids && ids.length > 0) {
      await Notification.updateMany({ _id: { $in: ids }, recipient: req.user._id }, { isRead: true, readAt: new Date() });
    } else {
      await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
    }
    ApiResponse.success(res, null, 'Notifications marked as read');
  } catch (err) { next(err); }
};

const deleteNotification = async (req, res, next) => {
  try {
    const notif = await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
    if (!notif) return next(createError('Notification not found', 404));
    ApiResponse.success(res, null, 'Notification deleted');
  } catch (err) { next(err); }
};

module.exports = { getNotifications, markAsRead, deleteNotification };
