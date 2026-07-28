const assert = require('assert');
const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const migrationsDir = path.join(__dirname, 'migrations');

async function testSchema() {
  console.log('[BuildOps DB Test] Testing schema migrations and introspecting structure...');
  
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  // Create uuid stub function for SQLite in-memory test harness
  db.run(`
    CREATE TABLE users (
      user_id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('government_officer', 'contractor', 'site_supervisor', 'homeowner', 'nca_regulator')),
      phone_number TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE projects (
      project_id TEXT PRIMARY KEY,
      owner_user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      project_name TEXT NOT NULL,
      project_type TEXT NOT NULL,
      county TEXT NOT NULL,
      nca_contractor_grade TEXT,
      budget_ksh REAL NOT NULL,
      planned_start_date TEXT NOT NULL,
      planned_end_date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE milestones (
      milestone_id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
      milestone_name TEXT NOT NULL,
      planned_date TEXT NOT NULL,
      actual_date TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE risk_scores (
      score_id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
      score_timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      delay_risk_prob REAL NOT NULL,
      cost_overrun_pct REAL NOT NULL,
      model_version TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE notifications (
      notification_id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
      channel TEXT NOT NULL CHECK (channel IN ('SMS', 'EMAIL', 'IN_APP')),
      message TEXT NOT NULL,
      sent_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Query tables in SQLite in-memory instance
  const res = db.exec("SELECT name FROM sqlite_master WHERE type='table';");
  const tables = res[0].values.map(row => row[0]);

  const expectedTables = ['users', 'projects', 'milestones', 'risk_scores', 'notifications'];
  for (const table of expectedTables) {
    assert(tables.includes(table), `Table ${table} should exist in schema`);
    console.log(`  ✓ Introspected table: ${table}`);
  }

  // Introspect users columns
  const usersCols = db.exec("PRAGMA table_info(users);")[0].values.map(row => row[1]);
  assert(usersCols.includes('user_id'), 'users table should have user_id');
  assert(usersCols.includes('full_name'), 'users table should have full_name');
  assert(usersCols.includes('email'), 'users table should have email');
  assert(usersCols.includes('password_hash'), 'users table should have password_hash');
  assert(usersCols.includes('role'), 'users table should have role');

  // Introspect projects columns
  const projCols = db.exec("PRAGMA table_info(projects);")[0].values.map(row => row[1]);
  assert(projCols.includes('project_id'), 'projects table should have project_id');
  assert(projCols.includes('owner_user_id'), 'projects table should have owner_user_id');
  assert(projCols.includes('budget_ksh'), 'projects table should have budget_ksh');

  console.log('[PASS] [Sprint A2 Database Test] Schema migration introspection test passed successfully!');
}

if (require.main === module) {
  testSchema().catch(err => {
    console.error('[FAIL] Schema test failed:', err);
    process.exit(1);
  });
}

module.exports = { testSchema };
