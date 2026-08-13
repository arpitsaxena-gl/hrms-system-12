const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { register, login, getMe, updatePassword, refreshToken, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema, refreshSchema, logoutSchema, updatePasswordSchema } = require('../validators/auth.schema');

// Dedicated stricter limiter for credential endpoints, separate from the global
// API limiter (SEC-8).
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '10', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user (always created as an employee)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password]
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string }
 *               password: { type: string, minLength: 6 }
 *     responses:
 *       201: { description: User registered }
 *       400: { description: Validation error }
 */
router.post('/register', validate.schema(registerSchema), register);
router.post('/login', loginLimiter, validate.schema(loginSchema), login);
router.get('/me', protect, getMe);
router.put('/password', protect, validate.schema(updatePasswordSchema), updatePassword);
router.post('/refresh', loginLimiter, validate.schema(refreshSchema), refreshToken);
router.post('/logout', protect, validate.schema(logoutSchema), logout);

module.exports = router;
