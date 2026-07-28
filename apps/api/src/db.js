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

    // Memory Store Implementation
    const lowerSql = text.trim().toLowerCase();

    // USERS QUERIES
    if (lowerSql.includes('from users')) {
      if (lowerSql.includes('email =')) {
        const emailParam = params[0];
        const user = memoryStore.users.find(u => u.email.toLowerCase() === (emailParam || '').toLowerCase());
        return { rows: user ? [user] : [] };
      }
      if (lowerSql.includes('user_id =')) {
        const idParam = params[0];
        const user = memoryStore.users.find(u => u.user_id === idParam);
        return { rows: user ? [user] : [] };
      }
    }

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

    // PROJECTS QUERIES
    if (lowerSql.startsWith('insert into projects')) {
      const [owner_user_id, project_name, project_type, county, nca_contractor_grade, budget_ksh, planned_start_date, planned_end_date] = params;
      const newProject = {
        project_id: crypto.randomUUID(),
        owner_user_id,
        project_name,
        project_type,
        county,
        nca_contractor_grade: nca_contractor_grade || null,
        budget_ksh: parseFloat(budget_ksh),
        planned_start_date,
        planned_end_date,
        created_at: new Date().toISOString()
      };
      memoryStore.projects.push(newProject);
      return { rows: [newProject] };
    }

    if (lowerSql.includes('from projects')) {
      // Select single project by project_id
      if (lowerSql.includes('project_id =') && !lowerSql.includes('owner_user_id =')) {
        const id = params[0];
        const project = memoryStore.projects.find(p => p.project_id === id);
        return { rows: project ? [project] : [] };
      }

      // Select single project by project_id and owner_user_id
      if (lowerSql.includes('project_id =') && lowerSql.includes('owner_user_id =')) {
        const [project_id, owner_user_id] = params;
        const project = memoryStore.projects.find(p => p.project_id === project_id && p.owner_user_id === owner_user_id);
        return { rows: project ? [project] : [] };
      }

      // Select projects by owner_user_id
      if (lowerSql.includes('owner_user_id =')) {
        const owner_id = params[0];
        const projects = memoryStore.projects.filter(p => p.owner_user_id === owner_id);
        return { rows: projects };
      }

      // Select all projects
      return { rows: [...memoryStore.projects] };
    }

    // UPDATE projects
    if (lowerSql.startsWith('update projects')) {
      const [project_name, project_type, county, nca_contractor_grade, budget_ksh, planned_start_date, planned_end_date, project_id, owner_user_id] = params;
      const index = memoryStore.projects.findIndex(p => p.project_id === project_id && p.owner_user_id === owner_user_id);
      if (index === -1) {
        return { rows: [] };
      }

      memoryStore.projects[index] = {
        ...memoryStore.projects[index],
        project_name: project_name || memoryStore.projects[index].project_name,
        project_type: project_type || memoryStore.projects[index].project_type,
        county: county || memoryStore.projects[index].county,
        nca_contractor_grade: nca_contractor_grade || memoryStore.projects[index].nca_contractor_grade,
        budget_ksh: budget_ksh !== undefined ? parseFloat(budget_ksh) : memoryStore.projects[index].budget_ksh,
        planned_start_date: planned_start_date || memoryStore.projects[index].planned_start_date,
        planned_end_date: planned_end_date || memoryStore.projects[index].planned_end_date
      };

      return { rows: [memoryStore.projects[index]] };
    }

    // DELETE from projects
    if (lowerSql.startsWith('delete from projects')) {
      const [project_id, owner_user_id] = params;
      const index = memoryStore.projects.findIndex(p => p.project_id === project_id && p.owner_user_id === owner_user_id);
      if (index === -1) {
        return { rows: [] };
      }
      const deleted = memoryStore.projects.splice(index, 1)[0];
      return { rows: [deleted] };
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
