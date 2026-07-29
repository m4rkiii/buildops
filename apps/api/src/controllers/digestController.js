const { query } = require('../db');
const mlClient = require('../services/mlClient');
const riskService = require('../services/riskService');

async function getProjectDigest(req, res) {
  try {
    const { projectId } = req.params;

    // 1. Fetch project details
    const projResult = await query('SELECT * FROM projects WHERE project_id = $1', [projectId]);
    if (projResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const project = projResult.rows[0];

    // Ensure project belongs to user (or authorized role)
    if (req.user && req.user.role !== 'government_officer' && req.user.role !== 'nca_regulator') {
      if (project.owner_user_id !== req.user.user_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // 2. Fetch milestone stats
    const msResult = await query('SELECT * FROM milestones WHERE project_id = $1', [projectId]);
    const milestones = msResult.rows;
    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter(m => m.status === 'completed').length;
    const delayedMilestones = milestones.filter(m => m.status === 'delayed');
    const currentDelayDays = delayedMilestones.length * 14;

    // 3. Fetch latest risk score
    const riskScore = await riskService.getLatestRiskScore(projectId);

    const startDate = new Date(project.planned_start_date || Date.now());
    const endDate = new Date(project.planned_end_date || Date.now() + 180 * 86400000);
    const durationDays = Math.max(Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)), 30);

    const digestPayload = {
      project_name: project.project_name,
      project_type: project.project_type,
      county: project.county,
      nca_contractor_grade: project.nca_contractor_grade || 'NCA 1',
      budget_ksh: parseFloat(project.budget_ksh),
      planned_duration_days: durationDays,
      completed_milestones_count: completedMilestones,
      total_milestones_count: Math.max(totalMilestones, 1),
      current_delay_days: currentDelayDays,
      delay_risk_score: riskScore ? riskScore.delay_risk_score : 0.20,
      cost_overrun_pct: riskScore ? riskScore.cost_overrun_pct : 2.5
    };

    // 4. Generate AI digest report
    const digest = await mlClient.generateAIDigest(digestPayload);

    return res.json({
      project_id: projectId,
      digest
    });
  } catch (err) {
    console.error('[DigestController Error] getProjectDigest failed:', err.message);
    return res.status(500).json({ error: 'Failed to generate AI executive digest' });
  }
}

module.exports = {
  getProjectDigest
};
