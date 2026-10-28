const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');

// Stats endpoint
router.get('/stats', applicationController.getStats);

// List applications with search & filter, and create application
router.route('/')
  .get(applicationController.getAllApplications)
  .post(applicationController.createApplication);

// Details, edit, delete
router.route('/:id')
  .get(applicationController.getApplicationById)
  .put(applicationController.updateApplication)
  .delete(applicationController.deleteApplication);

// Status transition
router.patch('/:id/status', applicationController.updateStatus);

module.exports = router;
