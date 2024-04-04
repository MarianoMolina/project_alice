const express = require('express');
const router = express.Router();
const JobRoleResponsibility = require('../models/jobRoleResponsibility');

// Create a new job role responsibility
router.post('/', async (req, res) => {
  try {
    const jobRoleResponsibility = new JobRoleResponsibility(req.body);
    await jobRoleResponsibility.save();
    res.status(201).json(jobRoleResponsibility);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all job role responsibilities
router.get('/', async (req, res) => {
  try {
    const jobRoleResponsibilities = await JobRoleResponsibility.find();
    res.json(jobRoleResponsibilities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ... Implement other CRUD routes for job role responsibilities
// Update a job role responsibility
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const jobRoleResponsibility = await JobRoleResponsibility.findByIdAndUpdate(id, req.body, { new: true });
    if (!jobRoleResponsibility) {
      return res.status(404).json({ message: 'Job role responsibility not found' });
    }
    res.json(jobRoleResponsibility);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a job role responsibility
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const jobRoleResponsibility = await JobRoleResponsibility.findByIdAndDelete(id);
    if (!jobRoleResponsibility) {
      return res.status(404).json({ message: 'Job role responsibility not found' });
    }
    res.json({ message: 'Job role responsibility deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
module.exports = router;