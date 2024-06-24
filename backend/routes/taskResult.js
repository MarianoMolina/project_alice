const express = require('express');
const router = express.Router();
const TaskResult = require('../models/TaskResult');
const auth = require('../middleware/auth');

// Create a new TaskResult
router.post('/', auth, async (req, res) => {
  try {
    const taskResult = new TaskResult({
      ...req.body,
      created_by: req.user.userId,
      updated_by: req.user.userId
    });
    await taskResult.save();
    res.status(201).json(taskResult);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all TaskResults
router.get('/', auth, async (req, res) => {
  try {
    const taskResults = await TaskResult.find();
    res.status(200).json(taskResults);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a TaskResult by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const taskResult = await TaskResult.findById(req.params.id);
    if (!taskResult) {
      return res.status(404).json({ message: 'TaskResult not found' });
    }
    res.status(200).json(taskResult);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a TaskResult by ID
router.patch('/:id', auth, async (req, res) => {
  try {
    const taskResult = await TaskResult.findById(req.params.id);
    if (!taskResult) {
      return res.status(404).json({ message: 'TaskResult not found' });
    }
    Object.assign(taskResult, req.body, { updated_by: req.user.userId });
    await taskResult.save();
    res.status(200).json(taskResult);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a TaskResult by ID
router.delete('/:id', auth, async (req, res) => {
  try {
    const taskResult = await TaskResult.findByIdAndDelete(req.params.id);
    if (!taskResult) {
      return res.status(404).json({ message: 'TaskResult not found' });
    }
    res.status(200).json({ message: 'TaskResult deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;