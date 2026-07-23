const Notification = require('../models/Notification');
const logger = require('../utils/logger');

let io;
const connectedUsers = new Map();

const initializeSocket = (socketIo) => {
  io = socketIo;
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);
    socket.on('join', (userId) => {
      connectedUsers.set(userId, socket.id);
      socket.join(`user:${userId}`);
      logger.info(`User ${userId} joined room`);
    });
    socket.on('disconnect', () => {
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) { connectedUsers.delete(userId); break; }
      }
    });
  });
};

const sendNotification = async (userId, notification) => {
  try {
    const saved = await Notification.create({ recipient: userId, ...notification });
    if (io) io.to(`user:${userId}`).emit('notification', saved);
    return saved;
  } catch (err) {
    logger.error(`Notification error: ${err.message}`);
  }
};

const sendBulkNotification = async (userIds, notification) => {
  const promises = userIds.map(id => sendNotification(id, notification));
  return Promise.allSettled(promises);
};

module.exports = { initializeSocket, sendNotification, sendBulkNotification, connectedUsers };
