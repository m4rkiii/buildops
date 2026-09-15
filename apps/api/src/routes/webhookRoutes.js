/**
 * BuildOps Sentinel — Supabase Database Webhooks Router
 * Listens for Supabase Database Webhooks (INSERT / UPDATE events on projects & milestones)
 * Automatically triggers live risk calculation on the Python FastAPI ML microservice.
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * POST /api/webhooks/supabase-event
 * Supabase Database Webhook handler
 */
router.post('/supabase-event', async (req, res) => {
  try {
    const { type, table, record, old_record } = req.body;

    console.log(`[Supabase Webhook] Event ${type} on table ${table}`);

    if (table === 'projects' || table === 'milestones') {
      const projectId = record.project_id || (record.id ? record.id : null);
      if (!projectId) {
        return res.status(400).json({ error: 'Missing project_id in webhook payload' });
      }

      // Fetch full project context
      const projectRes = await db.query('SELECT * FROM projects WHERE project_id = $1', [projectId]);
      if (projectRes.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const project = projectRes.rows[0];

      // Fetch milestone count & delay metrics
      const milestoneRes = await db.query('SELECT * FROM milestones WHERE project_id = $1', [projectId]);
      const milestones = milestoneRes.rows;
      const totalMilestones = milestones.length;
      const delayedMilestones = milestones.filter(m => m.status === 'delayed' || (m.actual_date && new Date(m.actual_date) > new Date(m.planned_date))).length;

      const plannedDays = Math.max(1, Math.ceil((new Date(project.planned_end_date) - new Date(project.planned_start_date)) / (1000 * 60 * 60 * 24)));

      const mlPayload = {
        project_type: project.project_type || 'Residential',
        county: project.county || 'Nairobi',
        nca_contractor_grade: project.nca_contractor_grade || 'NCA1',
        budget_ksh: parseFloat(project.budget_ksh || 1000000),
        planned_duration_days: plannedDays,
        total_milestones: Math.max(1, totalMilestones),
        delayed_milestones: delayedMilestones
      };

      // Call FastAPI ML service for delay risk & cost overrun
      let delayProb = 0.35;
      let costOverrunPct = 5.0;

      try {
        const mlRes = await fetch(`${ML_SERVICE_URL}/predict/delay-risk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mlPayload)
        });
        if (mlRes.ok) {
          const mlData = await mlRes.json();
          delayProb = mlData.delay_probability;
        }
      } catch (err) {
        console.warn(`[Webhook Warning] ML delay prediction fallback used: ${err.message}`);
      }

      try {
        const costRes = await fetch(`${ML_SERVICE_URL}/predict/cost-overrun`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mlPayload)
        });
        if (costRes.ok) {
          const costData = await costRes.json();
          costOverrunPct = costData.cost_overrun_percentage;
        }
      } catch (err) {
        console.warn(`[Webhook Warning] ML cost overrun fallback used: ${err.message}`);
      }

      const riskLevel = delayProb > 0.6 || costOverrunPct > 15 ? 'HIGH' : delayProb > 0.3 ? 'MEDIUM' : 'LOW';

      // Store calculated risk score
      const scoreId = require('crypto').randomUUID();
      await db.query(
        `INSERT INTO risk_scores (score_id, project_id, delay_risk_score, cost_overrun_pct, risk_level, model_version, calculated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [scoreId, projectId, delayProb, costOverrunPct, riskLevel, 'supabase-webhook-v1.0.0']
      );

      return res.status(200).json({
        status: 'success',
        project_id: projectId,
        delay_risk_score: delayProb,
        cost_overrun_pct: costOverrunPct,
        risk_level: riskLevel
      });
    }

    return res.status(200).json({ status: 'ignored', message: `No action required for table ${table}` });
  } catch (err) {
    console.error(`[Supabase Webhook Error]`, err);
    return res.status(500).json({ error: 'Internal server webhook processing error', details: err.message });
  }
});

module.exports = router;
