const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, VALID_ROLES } = require('../middleware/auth');

const BCRYPT_COST_FACTOR = 12; // NFR04 requirement

/**
 * Register new user account
 */
async function register(req, res) {
  try {
    const { full_name, email, password, role, phone_number } = req.body;

    // Input Validation
    if (!full_name || !email || !password || !role) {
      return res.status(400).json({ error: 'full_name, email, password, and role are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        error: `Invalid role '${role}'. Valid roles are: ${VALID_ROLES.join(', ')}`
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check for existing email
    const existingUserRes = await db.query('SELECT user_id FROM users WHERE email = $1', [normalizedEmail]);
    if (existingUserRes.rows.length > 0) {
      return res.status(400).json({ error: 'Email address is already registered' });
    }

    // Hash password with bcrypt cost factor 12 (NFR04)
    const password_hash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);

    // Save User to DB
    const insertRes = await db.query(
      `INSERT INTO users (full_name, email, password_hash, role, phone_number)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id, full_name, email, role, phone_number, created_at`,
      [full_name.trim(), normalizedEmail, password_hash, role, phone_number || null]
    );

    const user = insertRes.rows[0];

    // Issue JWT Token (expires in 24h)
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        phone_number: user.phone_number,
        created_at: user.created_at
      },
      token
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email address is already registered' });
    }
    console.error('[Auth Error] Registration failed:', err);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
}

/**
 * User login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Fetch user from DB
    const userRes = await db.query(
      'SELECT user_id, full_name, email, password_hash, role, phone_number, created_at FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userRes.rows[0];

    // Verify password hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Issue JWT Token
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      message: 'Login successful',
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        phone_number: user.phone_number,
        created_at: user.created_at
      },
      token
    });
  } catch (err) {
    console.error('[Auth Error] Login failed:', err);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
}

/**
 * Get current authenticated user profile
 */
async function getProfile(req, res) {
  try {
    const userRes = await db.query(
      'SELECT user_id, full_name, email, role, phone_number, created_at FROM users WHERE user_id = $1',
      [req.user.user_id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    return res.status(200).json({ user: userRes.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
}

module.exports = {
  register,
  login,
  getProfile
};
