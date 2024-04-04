const express = require('express');
const router = express.Router();
const JobRole = require('../models/jobRole');

// Create a new job role
router.post('/', async (req, res) => {
  try {
    const jobRole = new JobRole(req.body);
    await jobRole.save();
    res.status(201).json(jobRole);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all job roles
router.get('/', async (req, res) => {
  try {
    const jobRoles = await JobRole.find();
    res.json(jobRoles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ... Implement other CRUD routes for job roles
// Update a job role
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const jobRole = await JobRole.findByIdAndUpdate(id, req.body, { new: true });
    if (!jobRole) {
      return res.status(404).json({ message: 'Job role not found' });
    }
    res.json(jobRole);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a job role
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const jobRole = await JobRole.findByIdAndDelete(id);
    if (!jobRole) {
      return res.status(404).json({ message: 'Job role not found' });
    }
    res.json({ message: 'Job role deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get a single job role
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const jobRole = await JobRole.findById(id);
    if (!jobRole) {
      return res.status(404).json({ message: 'Job role not found' });
    }
    res.json(jobRole);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;