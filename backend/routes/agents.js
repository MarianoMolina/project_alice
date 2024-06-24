const express = require('express');
const router = express.Router();
const Agent = require('../models/Agent');
const auth = require('../middleware/auth');
// Create a new Agent
router.post('/', auth, async (req, res) => {
  const user_id = req.user.userId;
  try {
    const agent = new Agent({
      ...req.body,
      created_by: user_id,
      updated_by: user_id
    });
    await agent.save();
    res.status(201).json(agent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all Agents
router.get('/', auth, async (req, res) => {
  try {
    const agents = await Agent.find();
    res.status(200).json(agents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get an Agent by ID
router.get('/:id', auth, async (req, res) => {
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
router.patch('/:id', auth, async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    Object.assign(agent, req.body, { updated_by: req.user.userId });
    await agent.save();
    res.status(200).json(agent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete an Agent by ID
router.delete('/:id', auth, async (req, res) => {
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