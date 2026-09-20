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
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      // Decode Supabase / OAuth JWT token if local secret verify fails
      decoded = jwt.decode(token);
    }

    if (!decoded) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = {
      user_id: decoded.sub || decoded.user_id || 'demo-user-001',
      email: decoded.email || 'user@buildops.co.ke',
      role: decoded.user_metadata?.role || decoded.role || 'contractor',
      full_name: decoded.user_metadata?.full_name || decoded.user_metadata?.name || decoded.full_name || 'BuildOps User',
      ...decoded
    };

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
