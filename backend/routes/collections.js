const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Mapping of route names to model names
const modelMapping = {
  agents: 'Agent',
  models: 'Model',
  tasks: 'Task',
  users: 'User',
  prompts: 'Prompt',
};

// Get all collections in the database
router.get('/', async (req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    res.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get schema for a specific collection
router.get('/:collectionName/schema', async (req, res) => {
  const { collectionName } = req.params;
  const sanitizedCollectionName = collectionName.toLowerCase();
  try {
    console.log(`Fetching schema for collection: ${sanitizedCollectionName}`);
    const modelName = modelMapping[sanitizedCollectionName];
    if (!modelName) {
      console.error(`Model not found for collection: ${sanitizedCollectionName}`);
      return res.status(400).json({ error: `Model not found for collection: ${sanitizedCollectionName}` });
    }
    const model = mongoose.model(modelName);
    const jsonSchema = model.schema.jsonSchema(); // Generate JSON schema

    console.log(`JSON Schema for ${collectionName}:`, jsonSchema);
    res.status(200).json(jsonSchema);
  } catch (error) {
    console.error('Error fetching schema:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;