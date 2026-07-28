const express = require('express');
const router = express.Router({ mergeParams: true });
const milestoneController = require('../controllers/milestoneController');
const { authenticateToken } = require('../middleware/auth');

// All milestone routes require authentication
router.use(authenticateToken);

router.post('/', milestoneController.createMilestone);
router.get('/', milestoneController.getMilestones);
router.get('/:milestoneId', milestoneController.getMilestoneById);
router.put('/:milestoneId', milestoneController.updateMilestone);
router.delete('/:milestoneId', milestoneController.deleteMilestone);

module.exports = router;
