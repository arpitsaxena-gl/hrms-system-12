require('express-async-errors');
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./src/config/db');
const { setupSwagger } = require('./src/config/swagger');
const logger = require('./src/utils/logger');
const errorHandler = require('./src/middleware/errorHandler');
const { initializeSocket } = require('./src/services/socketService');

const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const employeeRoutes = require('./src/routes/employees');
const departmentRoutes = require('./src/routes/departments');
const designationRoutes = require('./src/routes/designations');
const attendanceRoutes = require('./src/routes/attendance');
const leaveRoutes = require('./src/routes/leaves');
const payrollRoutes = require('./src/routes/payroll');
const recruitmentRoutes = require('./src/routes/recruitment');
const performanceRoutes = require('./src/routes/performance');
const trainingRoutes = require('./src/routes/training');
const documentRoutes = require('./src/routes/documents');
const holidayRoutes = require('./src/routes/holidays');
const shiftRoutes = require('./src/routes/shifts');
const notificationRoutes = require('./src/routes/notifications');
const reportRoutes = require('./src/routes/reports');
const dashboardRoutes = require('./src/routes/dashboard');
const profileRoutes = require('./src/routes/profile');
const settingRoutes = require('./src/routes/settings');
const auditRoutes = require('./src/routes/audit');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', methods: ['GET', 'POST'] }
});

connectDB();
initializeSocket(io);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(mongoSanitize());
app.use(compression());

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

setupSwagger(app);

app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date(), env: process.env.NODE_ENV }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/designations', designationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/audit', auditRoutes);

app.use(errorHandler);
app.use('*', (req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  logger.info(`API Docs: http://localhost:${PORT}/api-docs`);
});

module.exports = { app, server, io };
