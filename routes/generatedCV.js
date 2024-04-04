const express = require('express');
const router = express.Router();
const GeneratedCV = require('../models/generatedCV');

// Create a new generated CV
router.post('/', async (req, res) => {
  try {
    const generatedCV = new GeneratedCV(req.body);
    await generatedCV.save();
    res.status(201).json(generatedCV);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all generated CVs
router.get('/', async (req, res) => {
  try {
    const generatedCVs = await GeneratedCV.find();
    res.json(generatedCVs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ... Implement other CRUD routes for generated CVs
// Update a generated CV
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCV = await GeneratedCV.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updatedCV);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a generated CV
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await GeneratedCV.findByIdAndDelete(id);
    res.json({ message: 'Generated CV deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get a specific generated CV
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const generatedCV = await GeneratedCV.findById(id);
    res.json(generatedCV);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
module.exports = router;