const express = require('express');
const router = express.Router();
const Hobby = require('../models/hobby');

// Create a new hobby
router.post('/', async (req, res) => {
  try {
    const hobby = new Hobby(req.body);
    await hobby.save();
    res.status(201).json(hobby);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all hobbies
router.get('/', async (req, res) => {
  try {
    const hobbies = await Hobby.find();
    res.json(hobbies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ... Implement other CRUD routes for hobbies
// Update a hobby
router.put('/:id', async (req, res) => {
  try {
    const hobby = await Hobby.findById(req.params.id);
    if (!hobby) {
      return res.status(404).json({ message: 'Hobby not found' });
    }
    hobby.name = req.body.name;
    hobby.description = req.body.description;
    await hobby.save();
    res.json(hobby);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a hobby
router.delete('/:id', async (req, res) => {
  try {
    const hobby = await Hobby.findByIdAndDelete(req.params.id);
    if (!hobby) {
      return res.status(404).json({ message: 'Hobby not found' });
    }
    res.json({ message: 'Hobby deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;