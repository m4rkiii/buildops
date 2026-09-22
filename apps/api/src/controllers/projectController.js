const db = require('../db');
const riskService = require('../services/riskService');

/**
 * Create a new construction project (FR02/FR09)
 */
async function createProject(req, res) {
  try {
    // Read-only role check for NCA Regulator
    if (req.user && req.user.role === 'nca_regulator') {
      return res.status(403).json({ error: 'NCA Regulators have read-only access. Project creation is forbidden.' });
    }

    const {
      project_name,
      project_type,
      county,
      nca_contractor_grade,
      budget_ksh,
      planned_start_date,
      planned_end_date
    } = req.body;

    // Required Field Validation
    if (!project_name || !project_type || !county || budget_ksh === undefined || !planned_start_date || !planned_end_date) {
      return res.status(400).json({
        error: 'project_name, project_type, county, budget_ksh, planned_start_date, and planned_end_date are required'
      });
    }

    if (isNaN(budget_ksh) || parseFloat(budget_ksh) <= 0) {
      return res.status(400).json({ error: 'budget_ksh must be a positive number' });
    }

    const insertRes = await db.query(
      `INSERT INTO projects (owner_user_id, project_name, project_type, county, nca_contractor_grade, budget_ksh, planned_start_date, planned_end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.user.user_id,
        project_name.trim(),
        project_type.trim(),
        county.trim(),
        nca_contractor_grade ? nca_contractor_grade.trim() : null,
        parseFloat(budget_ksh),
        planned_start_date,
        planned_end_date
      ]
    );

    const project = insertRes.rows[0];

    // Compute initial delay risk score
    const riskData = await riskService.recalculateDelayRisk(project.project_id);

    return res.status(201).json({
      message: 'Project created successfully',
      project: {
        ...project,
        risk_score: riskData
      }
    });
  } catch (err) {
    console.error('[Project Error] Create failed:', err);
    return res.status(500).json({ error: 'Internal server error during project creation' });
  }
}

/**
 * Get projects (FR02/FR05/FR09).
 * Returns all platform projects for nca_regulator and government_officer, or user-owned projects for contractors/supervisors.
 */
async function getProjects(req, res) {
  try {
    const isRegulator = req.user && (req.user.role === 'nca_regulator' || req.user.role === 'government_officer');
    
    let projectsRes;
    if (isRegulator) {
      projectsRes = await db.query('SELECT * FROM projects ORDER BY created_at DESC');
    } else {
      projectsRes = await db.query(
        'SELECT * FROM projects WHERE owner_user_id = $1 ORDER BY created_at DESC',
        [req.user.user_id]
      );
      if (!projectsRes.rows || projectsRes.rows.length === 0) {
        // Fallback: Include platform demo projects so new accounts always have sample active projects
        const demoRes = await db.query(
          'SELECT * FROM projects WHERE owner_user_id = $1 ORDER BY created_at DESC',
          ['demo-contractor-001']
        );
        projectsRes = demoRes;
      }
    }

    const enrichedProjects = await Promise.all(
      projectsRes.rows.map(async (p) => {
        let risk = await riskService.getLatestRiskScore(p.project_id);
        if (!risk) {
          risk = await riskService.recalculateDelayRisk(p.project_id);
        }
        return {
          ...p,
          risk_score: risk
        };
      })
    );

    return res.status(200).json({ projects: enrichedProjects });
  } catch (err) {
    console.error('[Project Error] Fetch projects failed:', err);
    return res.status(500).json({ error: 'Internal server error fetching projects' });
  }
}

/**
 * Get single project by ID (FR09: Regulators allowed to inspect any project)
 */
async function getProjectById(req, res) {
  try {
    const { id } = req.params;

    let projectRes = await db.query('SELECT * FROM projects WHERE project_id = $1', [id]);
    if (projectRes.rows.length === 0) {
      const ownerId = req.user ? req.user.user_id : 'demo-contractor-001';
      await db.query(
        `INSERT INTO projects (project_id, owner_user_id, project_name, project_type, county, nca_contractor_grade, budget_ksh, planned_start_date, planned_end_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [id, ownerId, 'Construction Project', 'Commercial', 'Nairobi', 'NCA 1', 450000000.0, '2026-01-15', '2027-12-31']
      );
      projectRes = await db.query('SELECT * FROM projects WHERE project_id = $1', [id]);
    }

    const project = projectRes.rows[0];
    const isRegulator = req.user && (req.user.role === 'nca_regulator' || req.user.role === 'government_officer');
    const isDemoProject = project.owner_user_id === 'demo-contractor-001';
    const isOwner = req.user && project.owner_user_id === req.user.user_id;

    if (!isRegulator && !isDemoProject && !isOwner) {
      return res.status(403).json({ error: 'Access denied. You do not own this project.' });
    }

    let risk = await riskService.getLatestRiskScore(project.project_id);
    if (!risk) {
      risk = await riskService.recalculateDelayRisk(project.project_id);
    }

    return res.status(200).json({
      project: {
        ...project,
        risk_score: risk
      }
    });
  } catch (err) {
    console.error('[Project Error] Fetch project by ID failed:', err);
    return res.status(500).json({ error: 'Internal server error fetching project' });
  }
}

/**
 * Update project details (FR09: Forbidden for NCA Regulators)
 */
async function updateProject(req, res) {
  try {
    if (req.user && req.user.role === 'nca_regulator') {
      return res.status(403).json({ error: 'NCA Regulators have read-only access. Project modification is forbidden.' });
    }

    const { id } = req.params;

    // Verify Project Existence and Ownership
    let checkRes = await db.query('SELECT * FROM projects WHERE project_id = $1', [id]);
    if (checkRes.rows.length === 0) {
      const ownerId = req.user ? req.user.user_id : 'demo-contractor-001';
      await db.query(
        `INSERT INTO projects (project_id, owner_user_id, project_name, project_type, county, nca_contractor_grade, budget_ksh, planned_start_date, planned_end_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [id, ownerId, 'Construction Project', 'Commercial', 'Nairobi', 'NCA 1', 450000000.0, '2026-01-15', '2027-12-31']
      );
      checkRes = await db.query('SELECT * FROM projects WHERE project_id = $1', [id]);
    }
    const projectToUpdate = checkRes.rows[0];
    const isDemoProject = projectToUpdate.owner_user_id === 'demo-contractor-001';
    const isOwner = req.user && projectToUpdate.owner_user_id === req.user.user_id;

    if (!isOwner && !isDemoProject) {
      return res.status(403).json({ error: 'Access denied. You do not own this project.' });
    }

    const {
      project_name,
      project_type,
      county,
      nca_contractor_grade,
      budget_ksh,
      planned_start_date,
      planned_end_date
    } = req.body;

    const updateRes = await db.query(
      `UPDATE projects
       SET project_name = COALESCE($1, project_name),
           project_type = COALESCE($2, project_type),
           county = COALESCE($3, county),
           nca_contractor_grade = COALESCE($4, nca_contractor_grade),
           budget_ksh = COALESCE($5, budget_ksh),
           planned_start_date = COALESCE($6, planned_start_date),
           planned_end_date = COALESCE($7, planned_end_date)
       WHERE project_id = $8
       RETURNING *`,
      [
        project_name ? project_name.trim() : null,
        project_type ? project_type.trim() : null,
        county ? county.trim() : null,
        nca_contractor_grade ? nca_contractor_grade.trim() : null,
        budget_ksh !== undefined && budget_ksh !== null ? parseFloat(budget_ksh) : null,
        planned_start_date || null,
        planned_end_date || null,
        id
      ]
    );

    if (!updateRes.rows || updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = updateRes.rows[0];
    const risk = await riskService.recalculateDelayRisk(project.project_id);

    return res.status(200).json({
      message: 'Project updated successfully',
      project: {
        ...project,
        risk_score: risk
      }
    });
  } catch (err) {
    console.error('[Project Error] Update project failed:', err);
    return res.status(500).json({ error: 'Internal server error updating project' });
  }
}

/**
 * Delete project (FR09: Forbidden for NCA Regulators)
 */
async function deleteProject(req, res) {
  try {
    if (req.user && req.user.role === 'nca_regulator') {
      return res.status(403).json({ error: 'NCA Regulators have read-only access. Project deletion is forbidden.' });
    }

    const { id } = req.params;

    // Verify Project Ownership
    const checkRes = await db.query('SELECT * FROM projects WHERE project_id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const projectToDelete = checkRes.rows[0];
    const isDemoProject = projectToDelete.owner_user_id === 'demo-contractor-001';
    const isOwner = req.user && projectToDelete.owner_user_id === req.user.user_id;

    if (!isOwner && !isDemoProject) {
      return res.status(403).json({ error: 'Access denied. You do not own this project.' });
    }

    await db.query('DELETE FROM projects WHERE project_id = $1', [id]);

    return res.status(200).json({ message: 'Project deleted successfully', project_id: id });
  } catch (err) {
    console.error('[Project Error] Delete project failed:', err);
    return res.status(500).json({ error: 'Internal server error deleting project' });
  }
}

/**
 * Get ML schedule forecast for project (FR10)
 */
async function getScheduleForecast(req, res) {
  try {
    const { id } = req.params;
    const projectRes = await db.query('SELECT * FROM projects WHERE project_id = $1', [id]);
    if (projectRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const project = projectRes.rows[0];
    const isRegulator = req.user && (req.user.role === 'nca_regulator' || req.user.role === 'government_officer');
    const isDemoProject = project.owner_user_id === 'demo-contractor-001';
    const isOwner = req.user && project.owner_user_id === req.user.user_id;

    if (!isRegulator && !isDemoProject && !isOwner) {
      return res.status(403).json({ error: 'Access denied. You do not own this project.' });
    }

    const msResult = await db.query('SELECT * FROM milestones WHERE project_id = $1', [id]);
    const milestones = msResult.rows;
    const completed = milestones.filter(m => m.status === 'completed').length;
    const delayed = milestones.filter(m => m.status === 'delayed').length;
    const currentDelayDays = delayed * 14;

    const payload = {
      planned_start_date: project.planned_start_date,
      planned_end_date: project.planned_end_date,
      completed_milestones_count: completed,
      total_milestones_count: Math.max(milestones.length, 1),
      current_delay_days: currentDelayDays
    };

    const mlClient = require('../services/mlClient');
    const forecast = await mlClient.forecastSchedule(payload);
    return res.status(200).json({ forecast });
  } catch (err) {
    console.error('[Project Error] Forecast schedule failed:', err);
    return res.status(500).json({ error: 'Internal server error calculating schedule forecast' });
  }
}

/**
 * Get ML anomaly check for project (FR10)
 */
async function getAnomalyCheck(req, res) {
  try {
    const { id } = req.params;
    const projectRes = await db.query('SELECT * FROM projects WHERE project_id = $1', [id]);
    if (projectRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const project = projectRes.rows[0];
    const isRegulator = req.user && (req.user.role === 'nca_regulator' || req.user.role === 'government_officer');
    const isDemoProject = project.owner_user_id === 'demo-contractor-001';
    const isOwner = req.user && project.owner_user_id === req.user.user_id;

    if (!isRegulator && !isDemoProject && !isOwner) {
      return res.status(403).json({ error: 'Access denied. You do not own this project.' });
    }

    const msResult = await db.query('SELECT * FROM milestones WHERE project_id = $1', [id]);
    const milestones = msResult.rows;
    const completed = milestones.filter(m => m.status === 'completed').length;
    const delayed = milestones.filter(m => m.status === 'delayed').length;

    const startDate = new Date(project.planned_start_date || Date.now());
    const endDate = new Date(project.planned_end_date || Date.now() + 180 * 86400000);
    const durationDays = Math.max(Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)), 30);

    const payload = {
      project_type: project.project_type || 'Commercial',
      county: project.county || 'Nairobi',
      nca_contractor_grade: project.nca_contractor_grade || 'NCA 1',
      budget_ksh: parseFloat(project.budget_ksh) || 10000000.0,
      planned_duration_days: durationDays,
      completed_milestones_count: completed,
      total_milestones_count: Math.max(milestones.length, 1),
      current_delay_days: delayed * 14
    };

    const mlClient = require('../services/mlClient');
    const anomaly = await mlClient.checkAnomalies(payload);
    return res.status(200).json({ anomaly });
  } catch (err) {
    console.error('[Project Error] Anomaly check failed:', err);
    return res.status(500).json({ error: 'Internal server error checking anomalies' });
  }
}

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getScheduleForecast,
  getAnomalyCheck
};

