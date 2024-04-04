const express = require('express');
const router = express.Router();
const Education = require('../models/education');

// Create a new education record
router.post('/', async (req, res) => {
  try {
    const education = new Education(req.body);
    await education.save();
    res.status(201).json(education);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all education records
router.get('/', async (req, res) => {
  try {
    const educationRecords = await Education.find();
    res.json(educationRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ... Implement other CRUD routes for education records
// Update an education record
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedEducation = await Education.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updatedEducation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete an education record
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Education.findByIdAndDelete(id);
    res.json({ message: 'Education record deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get a specific education record
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const educationRecord = await Education.findById(id);
    res.json(educationRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;