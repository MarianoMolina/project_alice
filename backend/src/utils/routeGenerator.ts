import { Response, Router } from 'express';
import { Model, Document, Types } from 'mongoose';
import { AuthRequest } from '../interfaces/auth.interface';
import adminOnly from '../middleware/admin.middleware';

type RouteHandler = (req: AuthRequest, res: Response) => Promise<void>;
type ModelName = 'Agent' | 'Model' | 'Task' | 'Prompt' | 'TaskResult' | 'AliceChat' | 'API' | 'ParameterDefinition' | 'User' | 'FileReference' | 'Message' | 'URLReference';

interface RouteOptions<T extends Document> {
  createItem?: (data: Partial<T>, userId: string) => Promise<T | null>;
  updateItem?: (id: string, data: Partial<T>, userId: string) => Promise<T | null>;
  deleteItem?: (id: string, userId: string) => Promise<T | null>;
}

export function createRoutes<T extends Document, K extends ModelName>(
  model: Model<T>,
  modelName: K,
  options: RouteOptions<T> = {}
) {
  const router = Router();

  const handleErrors = (res: Response, error: any) => {
    console.error(`Error in ${modelName} route:`, error);
    res.status(500).json({ error: `An error occurred while processing ${modelName.toLowerCase()}` });
  };

  const createOne: RouteHandler = async (req, res) => {
    try {
      let saved_item: T | null;
      if (options.createItem) {
        if (!req.user?.userId) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }
        saved_item = await options.createItem(req.body, req.user?.userId);
      } else {
        const item = new model({
          ...req.body,
          created_by: req.user?.userId,
          updated_by: req.user?.userId
        });
        item._id = new Types.ObjectId();
        await item.save();
        saved_item = await model.findById(item._id);
      }
      if (!saved_item) {
        res.status(400).json({ error: `Failed to create ${modelName.toLowerCase()}` });
        return;
      }
      res.status(201).json(saved_item);
    } catch (error) {
      handleErrors(res, error);
    }
  };

  const updateOne: RouteHandler = async (req, res) => {
    try {
      let updated_item: T | null;
      if (options.updateItem) {
        if (!req.user?.userId) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }
        updated_item = await options.updateItem(req.params.id, req.body, req.user?.userId);
      } else {
        updated_item = await model.findOneAndUpdate(
          { _id: req.params.id, created_by: req.user?.userId },
          { ...req.body, updated_by: req.user?.userId },
          { new: true, runValidators: true }
        );
      }
      if (!updated_item) {
        res.status(404).json({ error: `${modelName} not found` });
        return;
      }
      res.status(200).json(updated_item);
    } catch (error) {
      handleErrors(res, error);
    }
  };

  const deleteOne: RouteHandler = async (req, res) => {
    try {
      let deleted_item: T | null;
      if (options.deleteItem) {
        deleted_item = await options.deleteItem(req.params.id, req.user?.userId ?? '');
      } else {
        deleted_item = await model.findOneAndDelete({ _id: req.params.id, created_by: req.user?.userId });
      }
      if (!deleted_item) {
        res.status(404).json({ error: `${modelName} not found` });
        return;
      }
      res.status(200).json({ message: `${modelName} deleted successfully` });
    } catch (error) {
      handleErrors(res, error);
    }
  };

  const getAll: RouteHandler = async (req, res) => {
    try {
      const items = await model.find({ created_by: req.user?.userId });
      res.status(200).json(items);
    } catch (error) {
      handleErrors(res, error);
    }
  };

  const getAllAdmin: RouteHandler = async (req, res) => {
    try {
      const items = await model.find();
      res.status(200).json(items);
    } catch (error) {
      handleErrors(res, error);
    }
  };

  const getOne: RouteHandler = async (req, res) => {
    try {
      const item = await model.findOne({ _id: req.params.id, created_by: req.user?.userId });
      if (!item) {
        res.status(404).json({ error: `${modelName} not found` });
        return;
      }
      res.status(200).json(item);
    } catch (error) {
      handleErrors(res, error);
    }
  };

  const getSchema: RouteHandler = async (req, res) => {
    try {
      const schema = model.schema.obj;
      res.status(200).json(schema);
    } catch (error) {
      handleErrors(res, error);
    }
  };

  router.post('/', createOne);
  router.get('/', getAll);
  router.get('/all', adminOnly, getAllAdmin);
  router.get('/:id', getOne);
  router.patch('/:id', updateOne);
  router.delete('/:id', deleteOne);
  router.get('/schema', getSchema);

  return router;
}