const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected profile route
router.get('/me', authenticateToken, authController.getProfile);

// Example role-protected route (used for testing role verification)
router.get('/contractor-only', authenticateToken, requireRole('contractor'), (req, res) => {
  res.status(200).json({ message: 'Welcome contractor', user: req.user });
});

module.exports = router;
