const { query, isMemoryMode } = require('../db');
const smsService = require('./smsService');
const crypto = require('crypto');

/**
 * Notification Service for BuildOps Sentinel (FR04, FR07)
 */
async function checkAndDispatchAlerts(projectId, riskScoreData) {
  if (!projectId || !riskScoreData) return null;

  try {
    const delayProb = riskScoreData.delay_risk_score || 0.0;
    const costPct = riskScoreData.cost_overrun_pct || 0.0;
    const isHighDelay = delayProb >= 0.65;
    const isHighCost = costPct >= 10.0;

    // Only dispatch SMS alert if risk threshold is breached
    if (!isHighDelay && !isHighCost) {
      return null;
    }

    // 1. Fetch project and owner user details
    const projResult = await query('SELECT * FROM projects WHERE project_id = $1', [projectId]);
    if (projResult.rows.length === 0) return null;
    const project = projResult.rows[0];

    const userResult = await query('SELECT * FROM users WHERE user_id = $1', [project.owner_user_id]);
    const ownerPhone = userResult.rows.length > 0 ? userResult.rows[0].phone_number : '+254712345678';

    // 2. Format SMS alert message
    const delayPctStr = (delayProb * 100).toFixed(1);
    let alertReasons = [];
    if (isHighDelay) alertReasons.push(`High Delay Risk (${delayPctStr}%)`);
    if (isHighCost) alertReasons.push(`High Cost Overrun (+${costPct}%)`);

    const messageText = `[BuildOps Alert] Project '${project.project_name}' alert: ${alertReasons.join(' & ')}. Action required!`;

    // 3. Dispatch SMS
    const dispatchResult = await smsService.sendSMS(ownerPhone, messageText);

    // 4. Persist to notifications table
    const notificationId = crypto.randomUUID ? crypto.randomUUID() : `NOTIF-${Date.now()}`;
    const now = new Date();

    if (isMemoryMode()) {
      await query(
        `INSERT INTO notifications (notification_id, project_id, channel, message, sent_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [notificationId, projectId, 'SMS', messageText, now]
      );
    } else {
      await query(
        `INSERT INTO notifications (notification_id, project_id, channel, message, sent_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [notificationId, projectId, 'SMS', messageText, now]
      );
    }

    return {
      notification_id: notificationId,
      project_id: projectId,
      channel: 'SMS',
      message: messageText,
      sent_at: now,
      dispatch: dispatchResult
    };
  } catch (err) {
    console.error(`[NotificationService Error] Failed for project ${projectId}:`, err.message);
    return null;
  }
}

async function getProjectNotifications(projectId) {
  try {
    const result = await query(
      'SELECT * FROM notifications WHERE project_id = $1 ORDER BY sent_at DESC',
      [projectId]
    );
    return result.rows;
  } catch (err) {
    console.error(`[NotificationService Error] Get notifications failed:`, err.message);
    return [];
  }
}

async function getUserNotifications(userId) {
  try {
    // Fetch all user's projects first
    const projResult = await query('SELECT project_id FROM projects WHERE owner_user_id = $1', [userId]);
    const projectIds = projResult.rows.map(p => p.project_id);

    if (projectIds.length === 0) return [];

    const result = await query(
      'SELECT * FROM notifications WHERE project_id = ANY($1) ORDER BY sent_at DESC LIMIT 50',
      [projectIds]
    );
    return result.rows;
  } catch (err) {
    console.error(`[NotificationService Error] Get user notifications failed:`, err.message);
    return [];
  }
}

module.exports = {
  checkAndDispatchAlerts,
  getProjectNotifications,
  getUserNotifications
};
