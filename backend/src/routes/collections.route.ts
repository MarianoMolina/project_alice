import express, { Router, Request, Response } from 'express';
import mongoose, { Model } from 'mongoose';

const router: Router = express.Router();

// Mapping of route names to model names
const modelMapping: { [key: string]: string } = {
  agents: 'Agent',
  models: 'Model',
  tasks: 'Task',
  users: 'User',
  prompts: 'Prompt',
  taskresults: 'TaskResult',
  alicechats: 'AliceChat',
  apis: 'API',
  parameterdefinitions: 'ParameterDefinition',
};

// Get all collections in the database
router.get('/', async (_req: Request, res: Response) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    res.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get schema for a specific collection
router.get('/:collectionName/schema', async (req: Request, res: Response) => {
  const { collectionName } = req.params;
  const sanitizedCollectionName = collectionName.toLowerCase();
  try {
    const modelName = modelMapping[sanitizedCollectionName];
    if (!modelName) {
      console.log(`Models available: ${Object.keys(modelMapping)}`);
      console.error(`Model not found for collection: ${sanitizedCollectionName}`);
      return res.status(400).json({ error: `Model not found for collection: ${sanitizedCollectionName}` });
    }
    
    const model: Model<any> = mongoose.model(modelName);
    
    // Check if jsonSchema method exists on the schema
    const jsonSchemaMethod = (model.schema as any).jsonSchema;
    if (typeof jsonSchemaMethod !== 'function') {
      // If jsonSchema is not available, return the schema paths
      const schemaObject = Object.fromEntries(
        Object.entries(model.schema.paths).map(([key, value]) => [key, (value as any).instance])
      );
      return res.status(200).json(schemaObject);
    }
    
    const jsonSchema = jsonSchemaMethod.call(model.schema);
    console.log(`JSON Schema for ${collectionName}:`, jsonSchema);
    res.status(200).json(jsonSchema);
  } catch (error) {
    console.error('Error fetching schema:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;