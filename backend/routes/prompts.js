const express = require('express');
const router = express.Router();
const Prompt = require('../models/Prompt');
const auth = require('../middleware/auth');

// Create a new prompt
router.post('/', auth, async (req, res) => {
  try {
    const prompt = new Prompt({
      ...req.body,
      created_by: req.user.userId,
      updated_by: req.user.userId
    });
    await prompt.save();
    res.status(201).json(prompt);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all prompts
router.get('/', auth, async (req, res) => {
  try {
    const prompts = await Prompt.find()
    res.json(prompts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a prompt by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const prompt = await Prompt.findById(req.params.id)
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    res.json(prompt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a prompt by ID
router.patch('/:id', auth, async (req, res) => {
  try {
    const updatedPrompt = await Prompt.findOneAndUpdate(
      { _id: req.params.id },
      { 
        ...req.body, 
        updated_by: req.user.userId 
      },
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('created_by updated_by');

    if (!updatedPrompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    res.json(updatedPrompt);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a prompt by ID
router.delete('/:id', auth, async (req, res) => {
  try {
    const prompt = await Prompt.findByIdAndDelete(req.params.id)
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    res.json(prompt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
