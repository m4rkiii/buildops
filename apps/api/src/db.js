const { Pool } = require('pg');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const STORE_FILE_PATH = path.join(__dirname, '..', 'data', 'store.json');

// In-memory data store for standalone testing when live PostgreSQL is unavailable
const memoryStore = {
  users: [],
  projects: [],
  milestones: [],
  risk_scores: [],
  notifications: []
};

function seedInitialDemoData() {
  const hash = bcrypt.hashSync('Password123!', 10);

  memoryStore.users = [
    {
      user_id: 'demo-contractor-001',
      full_name: 'Eng. Kamau Maina (Lead Contractor)',
      email: 'contractor@buildops.co.ke',
      password_hash: hash,
      role: 'contractor',
      phone_number: '+254712345678',
      created_at: new Date().toISOString()
    },
    {
      user_id: 'demo-regulator-002',
      full_name: 'Officer Njeri Wanjiku (NCA Regulator)',
      email: 'regulator@nca.go.ke',
      password_hash: hash,
      role: 'nca_regulator',
      phone_number: '+254722998877',
      created_at: new Date().toISOString()
    },
    {
      user_id: 'demo-officer-003',
      full_name: 'Hon. Otieno Omondi (Gov Officer)',
      email: 'officer@infrastructure.go.ke',
      password_hash: hash,
      role: 'government_officer',
      phone_number: '+254733445566',
      created_at: new Date().toISOString()
    },
    {
      user_id: 'demo-supervisor-004',
      full_name: 'Supervisor Hassan Ali',
      email: 'supervisor@buildops.co.ke',
      password_hash: hash,
      role: 'site_supervisor',
      phone_number: '+254700112233',
      created_at: new Date().toISOString()
    },
    {
      user_id: 'demo-homeowner-005',
      full_name: 'Dr. Grace Mutua',
      email: 'homeowner@buildops.co.ke',
      password_hash: hash,
      role: 'homeowner',
      phone_number: '+254788554433',
      created_at: new Date().toISOString()
    }
  ];

  memoryStore.projects = [
    {
      project_id: 'proj-001-nairobi-tower',
      owner_user_id: 'demo-contractor-001',
      project_name: 'Nairobi High-Rise Commercial Tower',
      project_type: 'Commercial',
      county: 'Nairobi',
      nca_contractor_grade: 'NCA 1',
      budget_ksh: 450000000.0,
      planned_start_date: '2026-01-15',
      planned_end_date: '2027-12-31',
      created_at: new Date().toISOString()
    },
    {
      project_id: 'proj-002-mombasa-bridge',
      owner_user_id: 'demo-contractor-001',
      project_name: 'Mombasa Bypass Interchange & Coastal Civil Works',
      project_type: 'Infrastructure',
      county: 'Mombasa',
      nca_contractor_grade: 'NCA 1',
      budget_ksh: 850000000.0,
      planned_start_date: '2026-03-01',
      planned_end_date: '2028-06-30',
      created_at: new Date().toISOString()
    }
  ];

  memoryStore.milestones = [
    {
      milestone_id: 'm1-foundation',
      project_id: 'proj-001-nairobi-tower',
      milestone_name: 'Site Excavation & Deep Foundation Piling',
      planned_date: '2026-03-31',
      actual_date: '2026-03-28',
      status: 'completed',
      created_at: new Date().toISOString()
    },
    {
      milestone_id: 'm2-basement',
      project_id: 'proj-001-nairobi-tower',
      milestone_name: 'Substructure Concrete Pouring & Retaining Walls',
      planned_date: '2026-06-30',
      actual_date: '2026-07-05',
      status: 'completed',
      created_at: new Date().toISOString()
    },
    {
      milestone_id: 'm3-superstructure',
      project_id: 'proj-001-nairobi-tower',
      milestone_name: 'Structural Steel Frame & Multi-Story Slab Erection',
      planned_date: '2026-11-15',
      actual_date: null,
      status: 'in_progress',
      created_at: new Date().toISOString()
    },
    {
      milestone_id: 'm4-facade',
      project_id: 'proj-001-nairobi-tower',
      milestone_name: 'Curtain Wall Exterior Glazing & Weatherproofing',
      planned_date: '2027-04-30',
      actual_date: null,
      status: 'pending',
      created_at: new Date().toISOString()
    }
  ];

  memoryStore.risk_scores = [
    {
      score_id: 'risk-001',
      project_id: 'proj-001-nairobi-tower',
      delay_risk_score: 0.18,
      cost_overrun_pct: 4.2,
      risk_level: 'LOW',
      model_version: 'ensemble-v1.0.0',
      calculated_at: new Date().toISOString()
    }
  ];

  memoryStore.notifications = [
    {
      notification_id: 'notif-001',
      project_id: 'proj-001-nairobi-tower',
      channel: 'SMS',
      message: '[BuildOps Sentinel Alert] Substructure Concrete Pouring milestone completed on 2026-07-05.',
      sent_at: new Date().toISOString()
    }
  ];
}

function saveMemoryStoreToDisk() {
  try {
    const dir = path.dirname(STORE_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(memoryStore, null, 2), 'utf8');
  } catch (err) {
    console.error('[DB Error] Failed to persist memoryStore to disk:', err.message);
  }
}

function loadMemoryStoreFromDisk() {
  seedInitialDemoData();
  try {
    if (fs.existsSync(STORE_FILE_PATH)) {
      const data = fs.readFileSync(STORE_FILE_PATH, 'utf8');
      const saved = JSON.parse(data);
      if (saved) {
        if (Array.isArray(saved.users) && saved.users.length > 0) {
          const existingIds = new Set(memoryStore.users.map(u => u.user_id));
          saved.users.forEach(u => {
            if (!existingIds.has(u.user_id)) memoryStore.users.push(u);
          });
        }
        if (Array.isArray(saved.projects) && saved.projects.length > 0) {
          const existingIds = new Set(memoryStore.projects.map(p => p.project_id));
          saved.projects.forEach(p => {
            if (!existingIds.has(p.project_id)) memoryStore.projects.push(p);
          });
        }
        if (Array.isArray(saved.milestones) && saved.milestones.length > 0) {
          const existingIds = new Set(memoryStore.milestones.map(m => m.milestone_id));
          saved.milestones.forEach(m => {
            if (!existingIds.has(m.milestone_id)) memoryStore.milestones.push(m);
          });
        }
        if (Array.isArray(saved.risk_scores) && saved.risk_scores.length > 0) {
          const existingIds = new Set(memoryStore.risk_scores.map(r => r.score_id));
          saved.risk_scores.forEach(r => {
            if (!existingIds.has(r.score_id)) memoryStore.risk_scores.push(r);
          });
        }
        if (Array.isArray(saved.notifications) && saved.notifications.length > 0) {
          const existingIds = new Set(memoryStore.notifications.map(n => n.notification_id));
          saved.notifications.forEach(n => {
            if (!existingIds.has(n.notification_id)) memoryStore.notifications.push(n);
          });
        }
      }
    }
  } catch (err) {
    console.warn('[DB Warning] Failed to load memoryStore from disk:', err.message);
  }
}

// Seed & Load on module load
loadMemoryStoreFromDisk();

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
      saveMemoryStoreToDisk();
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
      saveMemoryStoreToDisk();
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
      const [project_name, project_type, county, nca_contractor_grade, budget_ksh, planned_start_date, planned_end_date, project_id] = params;
      const index = memoryStore.projects.findIndex(p => p.project_id === project_id);
      if (index === -1) {
        return { rows: [] };
      }

      memoryStore.projects[index] = {
        ...memoryStore.projects[index],
        project_name: project_name || memoryStore.projects[index].project_name,
        project_type: project_type || memoryStore.projects[index].project_type,
        county: county || memoryStore.projects[index].county,
        nca_contractor_grade: nca_contractor_grade || memoryStore.projects[index].nca_contractor_grade,
        budget_ksh: budget_ksh !== undefined && budget_ksh !== null ? parseFloat(budget_ksh) : memoryStore.projects[index].budget_ksh,
        planned_start_date: planned_start_date || memoryStore.projects[index].planned_start_date,
        planned_end_date: planned_end_date || memoryStore.projects[index].planned_end_date
      };

      saveMemoryStoreToDisk();
      return { rows: [memoryStore.projects[index]] };
    }

    if (lowerSql.startsWith('delete from projects')) {
      const project_id = params[0];
      const index = memoryStore.projects.findIndex(p => p.project_id === project_id);
      if (index === -1) {
        return { rows: [] };
      }
      const deleted = memoryStore.projects.splice(index, 1)[0];
      saveMemoryStoreToDisk();
      return { rows: [deleted] };
    }

    // MILESTONES QUERIES
    if (lowerSql.startsWith('insert into milestones')) {
      const [project_id, milestone_name, planned_date, actual_date, status, photo_url] = params;
      const newMilestone = {
        milestone_id: crypto.randomUUID(),
        project_id,
        milestone_name,
        planned_date,
        actual_date: actual_date || null,
        status: status || 'pending',
        photo_url: photo_url || null,
        created_at: new Date().toISOString()
      };
      memoryStore.milestones.push(newMilestone);
      saveMemoryStoreToDisk();
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
      const [milestone_name, planned_date, actual_date, status, photo_url, milestone_id, project_id] = params;
      const index = memoryStore.milestones.findIndex(m => m.milestone_id === milestone_id && m.project_id === project_id);
      if (index === -1) {
        return { rows: [] };
      }

      memoryStore.milestones[index] = {
        ...memoryStore.milestones[index],
        milestone_name: milestone_name || memoryStore.milestones[index].milestone_name,
        planned_date: planned_date || memoryStore.milestones[index].planned_date,
        actual_date: actual_date !== undefined ? actual_date : memoryStore.milestones[index].actual_date,
        status: status || memoryStore.milestones[index].status,
        photo_url: photo_url !== undefined ? photo_url : memoryStore.milestones[index].photo_url
      };

      saveMemoryStoreToDisk();
      return { rows: [memoryStore.milestones[index]] };
    }

    if (lowerSql.startsWith('delete from milestones')) {
      const [milestone_id, project_id] = params;
      const index = memoryStore.milestones.findIndex(m => m.milestone_id === milestone_id && m.project_id === project_id);
      if (index === -1) {
        return { rows: [] };
      }
      const deleted = memoryStore.milestones.splice(index, 1)[0];
      saveMemoryStoreToDisk();
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
      saveMemoryStoreToDisk();
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

    // NOTIFICATIONS QUERIES
    if (lowerSql.startsWith('insert into notifications')) {
      const [notification_id, project_id, channel, message, sent_at] = params;
      const newNotif = {
        notification_id,
        project_id,
        channel: channel || 'SMS',
        message,
        sent_at: sent_at || new Date().toISOString()
      };
      memoryStore.notifications.push(newNotif);
      saveMemoryStoreToDisk();
      return { rows: [newNotif] };
    }

    if (lowerSql.includes('from notifications')) {
      if (lowerSql.includes('project_id = any')) {
        const projectIds = params[0] || [];
        const notifs = memoryStore.notifications.filter(n => projectIds.includes(n.project_id));
        notifs.sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at));
        return { rows: notifs };
      }

      if (lowerSql.includes('project_id =')) {
        const pId = params[0];
        const notifs = memoryStore.notifications.filter(n => n.project_id === pId);
        notifs.sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at));
        return { rows: notifs };
      }

      const notifs = [...memoryStore.notifications];
      notifs.sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at));
      return { rows: notifs };
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
    seedInitialDemoData();
  }
};

module.exports = db;
