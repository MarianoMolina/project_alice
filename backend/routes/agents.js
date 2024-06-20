const express = require('express');
const router = express.Router();
const Agent = require('../models/Agent');

// Create a new Agent
router.post('/', async (req, res) => {
  try {
    console.log('Received POST request with body:', req.body);
    const agent = new Agent(req.body);
    await agent.save();
    console.log('Saved agent:', agent);
    res.status(201).json(agent);
  } catch (error) {
    console.error('Error saving agent:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get all Agents
router.get('/', async (req, res) => {
  try {
    const agents = await Agent.find();
    console.log('Fetched agents:', agents.length);
    res.status(200).json(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get an Agent by ID
router.get('/:id', async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.status(200).json(agent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update an Agent by ID
router.patch('/:id', async (req, res) => {
  try {
    const agent = await Agent.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.status(200).json(agent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete an Agent by ID
router.delete('/:id', async (req, res) => {
  try {
    const agent = await Agent.findByIdAndDelete(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.status(200).json({ message: 'Agent deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
