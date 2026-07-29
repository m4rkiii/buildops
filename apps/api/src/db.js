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
      if (lowerSql.includes('project_id =') && !lowerSql.includes('owner_user_id =')) {
        const id = params[0];
        const project = memoryStore.projects.find(p => p.project_id === id);
        return { rows: project ? [project] : [] };
      }

      if (lowerSql.includes('project_id =') && lowerSql.includes('owner_user_id =')) {
        const [project_id, owner_user_id] = params;
        const project = memoryStore.projects.find(p => p.project_id === project_id && p.owner_user_id === owner_user_id);
        return { rows: project ? [project] : [] };
      }

      if (lowerSql.includes('owner_user_id =')) {
        const owner_id = params[0];
        const projects = memoryStore.projects.filter(p => p.owner_user_id === owner_id);
        return { rows: projects };
      }

      return { rows: [...memoryStore.projects] };
    }

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

    if (lowerSql.startsWith('delete from projects')) {
      const [project_id, owner_user_id] = params;
      const index = memoryStore.projects.findIndex(p => p.project_id === project_id && p.owner_user_id === owner_user_id);
      if (index === -1) {
        return { rows: [] };
      }
      const deleted = memoryStore.projects.splice(index, 1)[0];
      return { rows: [deleted] };
    }

    // MILESTONES QUERIES
    if (lowerSql.startsWith('insert into milestones')) {
      const [project_id, milestone_name, planned_date, actual_date, status] = params;
      const newMilestone = {
        milestone_id: crypto.randomUUID(),
        project_id,
        milestone_name,
        planned_date,
        actual_date: actual_date || null,
        status: status || 'pending',
        created_at: new Date().toISOString()
      };
      memoryStore.milestones.push(newMilestone);
      return { rows: [newMilestone] };
    }

    if (lowerSql.includes('from milestones')) {
      if (lowerSql.includes('milestone_id =')) {
        const id = params[0];
        const m = memoryStore.milestones.find(m => m.milestone_id === id);
        return { rows: m ? [m] : [] };
      }

      if (lowerSql.includes('project_id =')) {
        const pId = params[0];
        const ms = memoryStore.milestones.filter(m => m.project_id === pId);
        return { rows: ms };
      }

      return { rows: [...memoryStore.milestones] };
    }

    if (lowerSql.startsWith('update milestones')) {
      const [milestone_name, planned_date, actual_date, status, milestone_id, project_id] = params;
      const index = memoryStore.milestones.findIndex(m => m.milestone_id === milestone_id && m.project_id === project_id);
      if (index === -1) {
        return { rows: [] };
      }

      memoryStore.milestones[index] = {
        ...memoryStore.milestones[index],
        milestone_name: milestone_name || memoryStore.milestones[index].milestone_name,
        planned_date: planned_date || memoryStore.milestones[index].planned_date,
        actual_date: actual_date !== undefined ? actual_date : memoryStore.milestones[index].actual_date,
        status: status || memoryStore.milestones[index].status
      };

      return { rows: [memoryStore.milestones[index]] };
    }

    if (lowerSql.startsWith('delete from milestones')) {
      const [milestone_id, project_id] = params;
      const index = memoryStore.milestones.findIndex(m => m.milestone_id === milestone_id && m.project_id === project_id);
      if (index === -1) {
        return { rows: [] };
      }
      const deleted = memoryStore.milestones.splice(index, 1)[0];
      return { rows: [deleted] };
    }

    // RISK SCORES QUERIES
    if (lowerSql.startsWith('insert into risk_scores')) {
      // Handles both 6-param (legacy) and 7-param queries (including cost_overrun_pct)
      let score_id, project_id, delay_risk_score, cost_overrun_pct, risk_level, model_version, calculated_at;
      if (params.length >= 7) {
        [score_id, project_id, delay_risk_score, cost_overrun_pct, risk_level, model_version, calculated_at] = params;
      } else {
        [score_id, project_id, delay_risk_score, risk_level, model_version, calculated_at] = params;
        cost_overrun_pct = 0.0;
      }

      const newScore = {
        score_id,
        project_id,
        delay_risk_score: parseFloat(delay_risk_score),
        cost_overrun_pct: parseFloat(cost_overrun_pct || 0),
        risk_level,
        model_version,
        calculated_at: calculated_at || new Date().toISOString()
      };
      
      const existingIdx = memoryStore.risk_scores.findIndex(r => r.project_id === project_id);
      if (existingIdx !== -1) {
        memoryStore.risk_scores[existingIdx] = newScore;
      } else {
        memoryStore.risk_scores.push(newScore);
      }
      return { rows: [newScore] };
    }

    if (lowerSql.includes('from risk_scores')) {
      if (lowerSql.includes('project_id =')) {
        const pId = params[0];
        const scores = memoryStore.risk_scores.filter(r => r.project_id === pId);
        scores.sort((a, b) => new Date(b.calculated_at) - new Date(a.calculated_at));
        return { rows: scores };
      }
      return { rows: [...memoryStore.risk_scores] };
    }

    return { rows: [] };
  },

  isMemoryMode() {
    return !pool || useMemoryStore;
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
