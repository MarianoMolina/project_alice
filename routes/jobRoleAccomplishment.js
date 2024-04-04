const express = require('express');
const router = express.Router();
const JobRoleAccomplishment = require('../models/jobRoleAccomplishment');

// Create a new job role accomplishment
router.post('/', async (req, res) => {
  try {
    const jobRoleAccomplishment = new JobRoleAccomplishment(req.body);
    await jobRoleAccomplishment.save();
    res.status(201).json(jobRoleAccomplishment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all job role accomplishments
router.get('/', async (req, res) => {
  try {
    const jobRoleAccomplishments = await JobRoleAccomplishment.find();
    res.json(jobRoleAccomplishments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ... Implement other CRUD routes for job role accomplishments
// Update a job role accomplishment
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const updatedJobRoleAccomplishment = await JobRoleAccomplishment.findByIdAndUpdate(id, { title, description }, { new: true });
    res.json(updatedJobRoleAccomplishment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a job role accomplishment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await JobRoleAccomplishment.findByIdAndDelete(id);
    res.json({ message: 'Job role accomplishment deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
module.exports = router;