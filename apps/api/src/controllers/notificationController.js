const notificationService = require('../services/notificationService');

async function getUserNotifications(req, res) {
  try {
    const userId = req.user.user_id;
    const notifications = await notificationService.getUserNotifications(userId);
    return res.json({ notifications });
  } catch (err) {
    console.error('[NotificationController Error] getUserNotifications failed:', err.message);
    return res.status(500).json({ error: 'Failed to fetch user notifications' });
  }
}

async function getProjectNotifications(req, res) {
  try {
    const { projectId } = req.params;
    const notifications = await notificationService.getProjectNotifications(projectId);
    return res.json({ notifications });
  } catch (err) {
    console.error('[NotificationController Error] getProjectNotifications failed:', err.message);
    return res.status(500).json({ error: 'Failed to fetch project notifications' });
  }
}

module.exports = {
  getUserNotifications,
  getProjectNotifications
};
