require('dotenv').config();
const http = require('http');
const socketIo = require('socket.io');

const { env, assertSecrets } = require('./src/config/env');

// Fail fast before doing anything else if secrets are missing/weak (SEC-2).
assertSecrets();

const { createApp } = require('./src/app');
const connectDB = require('./src/config/db');
const logger = require('./src/utils/logger');
const { initializeSocket } = require('./src/services/socketService');

const app = createApp();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: env.FRONTEND_URL, methods: ['GET', 'POST'] }
});

connectDB();
initializeSocket(io);

const PORT = env.PORT;
server.listen(PORT, () => {
  logger.info(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
  logger.info(`API Docs: http://localhost:${PORT}/api-docs`);
});

module.exports = { app, server, io };
