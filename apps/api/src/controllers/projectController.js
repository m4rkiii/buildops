const db = require('../db');
const riskService = require('../services/riskService');

/**
 * Create a new construction project (FR02)
 */
async function createProject(req, res) {
  try {
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
 * Get all projects owned by the authenticated user (FR02/FR05)
 */
async function getProjects(req, res) {
  try {
    const projectsRes = await db.query(
      'SELECT * FROM projects WHERE owner_user_id = $1 ORDER BY created_at DESC',
      [req.user.user_id]
    );

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
 * Get single project by ID (scoped to owner)
 */
async function getProjectById(req, res) {
  try {
    const { id } = req.params;

    const projectRes = await db.query('SELECT * FROM projects WHERE project_id = $1', [id]);

    if (projectRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectRes.rows[0];

    // Ownership Authorization Check
    if (project.owner_user_id !== req.user.user_id) {
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
 * Update project details (scoped to owner)
 */
async function updateProject(req, res) {
  try {
    const { id } = req.params;

    // Verify Project Ownership
    const checkRes = await db.query('SELECT * FROM projects WHERE project_id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (checkRes.rows[0].owner_user_id !== req.user.user_id) {
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
       WHERE project_id = $8 AND owner_user_id = $9
       RETURNING *`,
      [
        project_name ? project_name.trim() : null,
        project_type ? project_type.trim() : null,
        county ? county.trim() : null,
        nca_contractor_grade ? nca_contractor_grade.trim() : null,
        budget_ksh !== undefined ? parseFloat(budget_ksh) : null,
        planned_start_date || null,
        planned_end_date || null,
        id,
        req.user.user_id
      ]
    );

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
 * Delete project (scoped to owner)
 */
async function deleteProject(req, res) {
  try {
    const { id } = req.params;

    // Verify Project Ownership
    const checkRes = await db.query('SELECT * FROM projects WHERE project_id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (checkRes.rows[0].owner_user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Access denied. You do not own this project.' });
    }

    await db.query('DELETE FROM projects WHERE project_id = $1 AND owner_user_id = $2', [id, req.user.user_id]);

    return res.status(200).json({ message: 'Project deleted successfully', project_id: id });
  } catch (err) {
    console.error('[Project Error] Delete project failed:', err);
    return res.status(500).json({ error: 'Internal server error deleting project' });
  }
}

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject
};
