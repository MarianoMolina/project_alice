const express = require('express');
const router = express.Router();
const Model = require('../models/Model');

// Create a new Model
router.post('/', async (req, res) => {
  try {
    const model = new Model(req.body);
    await model.save();
    res.status(201).send(model);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get all Models
router.get('/', async (req, res) => {
  try {
    const models = await Model.find();
    res.send(models);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get an Model by ID
router.get('/:id', async (req, res) => {
  try {
    const model = await Model.findById(req.params.id);
    if (!model) {
      return res.status(404).send();
    }
    res.send(model);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update an Model by ID
router.patch('/:id', async (req, res) => {
  try {
    const model = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!model) {
      return res.status(404).send();
    }
    res.send(model);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete an Model by ID
router.delete('/:id', async (req, res) => {
  try {
    const model = await Model.findByIdAndDelete(req.params.id);
    if (!model) {
      return res.status(404).send();
    }
    res.send(model);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
