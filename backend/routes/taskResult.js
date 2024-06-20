const express = require('express');
const router = express.Router();
const TaskResult = require('../models/TaskResult');

// Create a new TaskResult
router.post('/', async (req, res) => {
  try {
    const taskResult = new TaskResult(req.body);
    await taskResult.save();
    res.status(201).send(taskResult);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get all TaskResults
router.get('/', async (req, res) => {
  try {
    const taskResults = await TaskResult.find();
    res.send(taskResults);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get a TaskResult by ID
router.get('/:id', async (req, res) => {
  try {
    const taskResult = await TaskResult.findById(req.params.id);
    if (!taskResult) {
      return res.status(404).send();
    }
    res.send(taskResult);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update a TaskResult by ID
router.patch('/:id', async (req, res) => {
  try {
    const taskResult = await TaskResult.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!taskResult) {
      return res.status(404).send();
    }
    res.send(taskResult);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete a TaskResult by ID
router.delete('/:id', async (req, res) => {
  try {
    const taskResult = await TaskResult.findByIdAndDelete(req.params.id);
    if (!taskResult) {
      return res.status(404).send();
    }
    res.send(taskResult);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;