const { query, isMemoryMode } = require('../db');
const mlClient = require('./mlClient');

async function recalculateDelayRisk(projectId) {
  try {
    // 1. Fetch project details
    const projResult = await query('SELECT * FROM projects WHERE project_id = $1', [projectId]);
    if (projResult.rows.length === 0) return null;
    const project = projResult.rows[0];

    // 2. Fetch milestone statistics
    const msResult = await query('SELECT * FROM milestones WHERE project_id = $1', [projectId]);
    const milestones = msResult.rows;

    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter(m => m.status === 'completed').length;
    const delayedMilestones = milestones.filter(m => m.status === 'delayed');

    // Calculate current delay days
    let maxDelayDays = 0;
    if (delayedMilestones.length > 0) {
      maxDelayDays = delayedMilestones.length * 14; // Default estimated delay per delayed milestone
    }

    // Calculate planned duration days
    const startDate = new Date(project.planned_start_date || Date.now());
    const endDate = new Date(project.planned_end_date || Date.now() + 180 * 86400000);
    const durationDays = Math.max(Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)), 30);

    const payload = {
      project_type: project.project_type || 'Commercial',
      county: project.county || 'Nairobi',
      nca_contractor_grade: project.nca_contractor_grade || 'NCA 1',
      budget_ksh: parseFloat(project.budget_ksh) || 10000000.0,
      planned_duration_days: durationDays,
      completed_milestones_count: completedMilestones,
      total_milestones_count: Math.max(totalMilestones, 1),
      current_delay_days: maxDelayDays
    };

    // 3. Query ML service
    const prediction = await mlClient.predictDelayRisk(payload);

    // 4. Persist to risk_scores DB table
    const scoreId = `RS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date();

    if (isMemoryMode()) {
      // Memory mode persistence
      await query(
        `INSERT INTO risk_scores (score_id, project_id, delay_risk_score, risk_level, model_version, calculated_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [scoreId, projectId, prediction.delay_risk_prob, prediction.risk_level, prediction.model_version, now]
      );
    } else {
      await query(
        `INSERT INTO risk_scores (score_id, project_id, delay_risk_score, risk_level, model_version, calculated_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (project_id) DO UPDATE SET
           delay_risk_score = EXCLUDED.delay_risk_score,
           risk_level = EXCLUDED.risk_level,
           model_version = EXCLUDED.model_version,
           calculated_at = EXCLUDED.calculated_at`,
        [scoreId, projectId, prediction.delay_risk_prob, prediction.risk_level, prediction.model_version, now]
      );
    }

    return {
      score_id: scoreId,
      project_id: projectId,
      delay_risk_score: prediction.delay_risk_prob,
      risk_level: prediction.risk_level,
      model_version: prediction.model_version,
      calculated_at: now
    };
  } catch (err) {
    console.error(`[RiskService Error] Recalculate failed for project ${projectId}:`, err.message);
    return null;
  }
}

async function getLatestRiskScore(projectId) {
  try {
    const result = await query(
      'SELECT * FROM risk_scores WHERE project_id = $1 ORDER BY calculated_at DESC LIMIT 1',
      [projectId]
    );

    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        score_id: row.score_id,
        delay_risk_score: parseFloat(row.delay_risk_score),
        risk_level: row.risk_level,
        model_version: row.model_version,
        calculated_at: row.calculated_at
      };
    }
    return null;
  } catch (err) {
    return null;
  }
}

module.exports = {
  recalculateDelayRisk,
  getLatestRiskScore
};
