const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const digestController = require('../controllers/digestController');
const milestoneRoutes = require('./milestoneRoutes');
const { authenticateToken } = require('../middleware/auth');

// All project routes require authentication
router.use(authenticateToken);

// Nested Milestone Routes
router.use('/:projectId/milestones', milestoneRoutes);

// Project Endpoints
router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:projectId/digest', digestController.getProjectDigest);
router.get('/:id', projectController.getProjectById);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

module.exports = router;
