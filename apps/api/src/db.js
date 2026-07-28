const { Pool } = require('pg');
const crypto = require('crypto');
require('dotenv').config();

// In-memory data store for standalone testing when live PostgreSQL is unavailable
const memoryStore = {
  users: [],
  projects: [],
  milestones: [],
  risk_scores: [],
  notifications: []
};

let pool = null;
let useMemoryStore = false;

if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
}

// Database Helper Interface
const db = {
  async query(text, params = []) {
    if (pool && !useMemoryStore) {
      try {
        return await pool.query(text, params);
      } catch (err) {
        console.warn(`[DB Warning] PostgreSQL query failed (${err.message}). Using memory store fallback.`);
        useMemoryStore = true;
      }
    }

    // Memory Store Implementation for Auth queries
    const lowerSql = text.trim().toLowerCase();

    // SELECT user by email
    if (lowerSql.startsWith('select') && lowerSql.includes('from users') && lowerSql.includes('email =')) {
      const emailParam = params[0];
      const user = memoryStore.users.find(u => u.email.toLowerCase() === (emailParam || '').toLowerCase());
      return { rows: user ? [user] : [] };
    }

    // SELECT user by user_id
    if (lowerSql.startsWith('select') && lowerSql.includes('from users') && lowerSql.includes('user_id =')) {
      const idParam = params[0];
      const user = memoryStore.users.find(u => u.user_id === idParam);
      return { rows: user ? [user] : [] };
    }

    // INSERT INTO users
    if (lowerSql.startsWith('insert into users')) {
      const [full_name, email, password_hash, role, phone_number] = params;
      const existing = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        const error = new Error('duplicate key value violates unique constraint "users_email_key"');
        error.code = '23505';
        throw error;
      }

      const newUser = {
        user_id: crypto.randomUUID(),
        full_name,
        email,
        password_hash,
        role,
        phone_number: phone_number || null,
        created_at: new Date().toISOString()
      };
      memoryStore.users.push(newUser);
      return { rows: [newUser] };
    }

    return { rows: [] };
  },

  setUseMemoryStore(flag) {
    useMemoryStore = flag;
  },

  resetMemoryStore() {
    memoryStore.users = [];
    memoryStore.projects = [];
    memoryStore.milestones = [];
    memoryStore.risk_scores = [];
    memoryStore.notifications = [];
  }
};

module.exports = db;
