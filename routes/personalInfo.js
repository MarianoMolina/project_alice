const express = require('express');
const router = express.Router();
const PersonalInfo = require('../models/personalInfo');

// Create new personal information
router.post('/', async (req, res) => {
  try {
    const personalInfo = new PersonalInfo(req.body);
    await personalInfo.save();
    res.status(201).json(personalInfo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get personal information
router.get('/', async (req, res) => {
  try {
    const personalInfo = await PersonalInfo.findOne();
    res.json(personalInfo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ... Implement other CRUD routes for personal information
// Update personal information
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const personalInfo = await PersonalInfo.findByIdAndUpdate(id, req.body, { new: true });
    res.json(personalInfo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete personal information
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await PersonalInfo.findByIdAndDelete(id);
    res.json({ message: 'Personal information deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
module.exports = router;