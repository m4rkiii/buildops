const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'buildops-sentinel-dev-secret-key-2026';

const VALID_ROLES = [
  'government_officer',
  'contractor',
  'site_supervisor',
  'homeowner',
  'nca_regulator'
];

/**
 * Authentication Middleware
 * Validates JWT token from Bearer header and attaches req.user
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Role-Based Access Control Middleware
 * @param  {...string} allowedRoles Roles authorized to access the route
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Role '${req.user.role}' is not authorized for this resource.`
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
  JWT_SECRET,
  VALID_ROLES
};
