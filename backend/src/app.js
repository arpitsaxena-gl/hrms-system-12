require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const { env } = require('./config/env');
const { setupSwagger } = require('./config/swagger');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const employeeRoutes = require('./routes/employees');
const departmentRoutes = require('./routes/departments');
const designationRoutes = require('./routes/designations');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leaves');
const payrollRoutes = require('./routes/payroll');
const recruitmentRoutes = require('./routes/recruitment');
const performanceRoutes = require('./routes/performance');
const trainingRoutes = require('./routes/training');
const documentRoutes = require('./routes/documents');
const holidayRoutes = require('./routes/holidays');
const shiftRoutes = require('./routes/shifts');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');
const profileRoutes = require('./routes/profile');
const settingRoutes = require('./routes/settings');
const auditRoutes = require('./routes/audit');
const fileRoutes = require('./routes/files');

/**
 * Build and return the configured Express app WITHOUT starting a listener or
 * connecting to MongoDB. This app factory is what the integration tests mount
 * via supertest; server.js wires the socket server, DB, and HTTP listener.
 */
function createApp() {
  const app = express();

  // Re-enabled, tuned Helmet CSP (replaces contentSecurityPolicy:false — SEC-6).
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: ["'self'", env.FRONTEND_URL, 'ws:', 'wss:'],
        fontSrc: ["'self'", 'https:', 'data:'],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
  app.use(mongoSanitize());
  app.use(compression());

  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15', 10) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    message: { success: false, message: 'Too many requests, please try again later.' },
  });
  app.use('/api/', limiter);

  app.use(cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  if (env.NODE_ENV === 'development') app.use(morgan('dev'));

  setupSwagger(app);

  app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date(), env: env.NODE_ENV }));

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

  // Authenticated file download replacing static /uploads (SEC-5).
  app.use('/api/files', fileRoutes);
  // One-release compatibility redirect for existing /uploads links.
  app.get('/uploads/:category/:filename', (req, res) =>
    res.redirect(307, `/api/files/${req.params.category}/${req.params.filename}`)
  );

  app.use('*', (req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
