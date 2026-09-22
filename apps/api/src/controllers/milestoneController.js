const db = require('../db');
const riskService = require('../services/riskService');

const VALID_STATUSES = ['pending', 'in_progress', 'completed', 'delayed'];

/**
 * Helper to verify project existence and user access
 */
async function verifyProjectAccess(projectId, user) {
  let projRes = await db.query('SELECT * FROM projects WHERE project_id = $1', [projectId]);
  if (projRes.rows.length === 0) {
    const ownerId = user ? user.user_id : 'demo-contractor-001';
    await db.query(
      `INSERT INTO projects (project_id, owner_user_id, project_name, project_type, county, nca_contractor_grade, budget_ksh, planned_start_date, planned_end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [projectId, ownerId, 'Construction Project', 'Commercial', 'Nairobi', 'NCA 1', 450000000.0, '2026-01-15', '2027-12-31']
    );
    projRes = await db.query('SELECT * FROM projects WHERE project_id = $1', [projectId]);
  }

  const project = projRes.rows[0];
  const isRegulator = user && (user.role === 'nca_regulator' || user.role === 'government_officer');
  const isDemoProject = project.owner_user_id === 'demo-contractor-001';
  const isOwner = user && project.owner_user_id === user.user_id;

  if (!isRegulator && !isDemoProject && !isOwner) {
    return { error: 'Access denied. You do not own this project.', status: 403 };
  }
  return { project };
}

/**
 * Create milestone under a project (FR03/FR05/FR09)
 */
async function createMilestone(req, res) {
  try {
    if (req.user && req.user.role === 'nca_regulator') {
      return res.status(403).json({ error: 'NCA Regulators have read-only access. Milestone creation is forbidden.' });
    }

    const { projectId } = req.params;
    const { milestone_name, planned_date, actual_date, status, photo_url } = req.body;

    const check = await verifyProjectAccess(projectId, req.user);
    if (check.error) {
      return res.status(check.status).json({ error: check.error });
    }

    if (!milestone_name || !planned_date) {
      return res.status(400).json({ error: 'milestone_name and planned_date are required' });
    }

    const milestoneStatus = status || 'pending';
    if (!VALID_STATUSES.includes(milestoneStatus)) {
      return res.status(400).json({
        error: `Invalid status '${milestoneStatus}'. Valid statuses are: ${VALID_STATUSES.join(', ')}`
      });
    }

    const insertRes = await db.query(
      `INSERT INTO milestones (project_id, milestone_name, planned_date, actual_date, status, photo_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [projectId, milestone_name.trim(), planned_date, actual_date || null, milestoneStatus, photo_url || null]
    );

    // Recalculate ML delay risk
    const riskData = await riskService.recalculateDelayRisk(projectId);

    return res.status(201).json({
      message: 'Milestone created successfully',
      milestone: insertRes.rows[0],
      risk_score: riskData
    });
  } catch (err) {
    console.error('[Milestone Error] Create failed:', err);
    return res.status(500).json({ error: 'Internal server error creating milestone' });
  }
}

/**
 * Get all milestones for a project (FR03/FR09)
 */
async function getMilestones(req, res) {
  try {
    const { projectId } = req.params;

    const check = await verifyProjectAccess(projectId, req.user);
    if (check.error) {
      return res.status(check.status).json({ error: check.error });
    }

    const milestonesRes = await db.query(
      'SELECT * FROM milestones WHERE project_id = $1 ORDER BY planned_date ASC',
      [projectId]
    );

    return res.status(200).json({ milestones: milestonesRes.rows });
  } catch (err) {
    console.error('[Milestone Error] Fetch milestones failed:', err);
    return res.status(500).json({ error: 'Internal server error fetching milestones' });
  }
}

/**
 * Get single milestone by ID (FR09)
 */
async function getMilestoneById(req, res) {
  try {
    const { projectId, milestoneId } = req.params;

    const check = await verifyProjectAccess(projectId, req.user);
    if (check.error) {
      return res.status(check.status).json({ error: check.error });
    }

    const mRes = await db.query('SELECT * FROM milestones WHERE milestone_id = $1 AND project_id = $2', [milestoneId, projectId]);

    if (mRes.rows.length === 0) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    return res.status(200).json({ milestone: mRes.rows[0] });
  } catch (err) {
    console.error('[Milestone Error] Fetch milestone failed:', err);
    return res.status(500).json({ error: 'Internal server error fetching milestone' });
  }
}

/**
 * Update milestone details (FR03/FR05/FR09)
 */
async function updateMilestone(req, res) {
  try {
    if (req.user && req.user.role === 'nca_regulator') {
      return res.status(403).json({ error: 'NCA Regulators have read-only access. Milestone modification is forbidden.' });
    }

    const { projectId, milestoneId } = req.params;

    const check = await verifyProjectAccess(projectId, req.user);
    if (check.error) {
      return res.status(check.status).json({ error: check.error });
    }

    const { milestone_name, planned_date, actual_date, status, photo_url } = req.body;

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid status '${status}'. Valid statuses are: ${VALID_STATUSES.join(', ')}`
      });
    }

    const updateRes = await db.query(
      `UPDATE milestones
       SET milestone_name = COALESCE($1, milestone_name),
           planned_date = COALESCE($2, planned_date),
           actual_date = COALESCE($3, actual_date),
           status = COALESCE($4, status),
           photo_url = COALESCE($5, photo_url)
       WHERE milestone_id = $6 AND project_id = $7
       RETURNING *`,
      [
        milestone_name ? milestone_name.trim() : null,
        planned_date || null,
        actual_date !== undefined ? actual_date : null,
        status || null,
        photo_url !== undefined ? photo_url : null,
        milestoneId,
        projectId
      ]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    // Recalculate ML delay risk
    const riskData = await riskService.recalculateDelayRisk(projectId);

    return res.status(200).json({
      message: 'Milestone updated successfully',
      milestone: updateRes.rows[0],
      risk_score: riskData
    });
  } catch (err) {
    console.error('[Milestone Error] Update milestone failed:', err);
    return res.status(500).json({ error: 'Internal server error updating milestone' });
  }
}

/**
 * Delete milestone (FR03/FR05/FR09)
 */
async function deleteMilestone(req, res) {
  try {
    if (req.user && req.user.role === 'nca_regulator') {
      return res.status(403).json({ error: 'NCA Regulators have read-only access. Milestone deletion is forbidden.' });
    }

    const { projectId, milestoneId } = req.params;

    const check = await verifyProjectAccess(projectId, req.user);
    if (check.error) {
      return res.status(check.status).json({ error: check.error });
    }

    const delRes = await db.query('DELETE FROM milestones WHERE milestone_id = $1 AND project_id = $2 RETURNING *', [milestoneId, projectId]);

    if (delRes.rows.length === 0) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    // Recalculate ML delay risk
    const riskData = await riskService.recalculateDelayRisk(projectId);

    return res.status(200).json({
      message: 'Milestone deleted successfully',
      milestone_id: milestoneId,
      risk_score: riskData
    });
  } catch (err) {
    console.error('[Milestone Error] Delete milestone failed:', err);
    return res.status(500).json({ error: 'Internal server error deleting milestone' });
  }
}

module.exports = {
  createMilestone,
  getMilestones,
  getMilestoneById,
  updateMilestone,
  deleteMilestone
};
