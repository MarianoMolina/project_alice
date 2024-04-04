const express = require('express');
const router = express.Router();
const SkillConnection = require('../models/skillConnection');

// Create a new skill connection
router.post('/', async (req, res) => {
  try {
    const skillConnection = new SkillConnection(req.body);
    await skillConnection.save();
    res.status(201).json(skillConnection);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all skill connections
router.get('/', async (req, res) => {
  try {
    const skillConnections = await SkillConnection.find();
    res.json(skillConnections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a skill connection 
router.put('/:id', async (req, res) => { 
  try { 
    const { id } = req.params; 
    const { name, description } = req.body; 
    const updatedSkillConnection = await SkillConnection.findByIdAndUpdate(id, { name, description }, { new: true }); res.json(updatedSkillConnection); 
  } catch (error) { 
    res.status(400).json({ message: error.message }); 
  } 
});

// Delete a skill connection 
router.delete('/:id', async (req, res) => { 
  try { 
    const { id } = req.params; await SkillConnection.findByIdAndDelete(id); 
    res.json({ message: 'Skill connection deleted successfully' }); 
  } catch (error) { 
    res.status(400).json({ message: error.message }); 
  } 
});

module.exports = router;