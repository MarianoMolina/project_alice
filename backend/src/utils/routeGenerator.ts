import { Response, Router } from 'express';
import { Model, Document, Types } from 'mongoose';
import { AuthRequest } from '../interfaces/auth.interface';
import adminOnly from '../middleware/admin.middleware';

type RouteHandler = (req: AuthRequest, res: Response) => Promise<void>;
type ModelName = 'Agent' | 'Model' | 'Task' | 'Prompt' | 'TaskResult' | 'AliceChat' | 'API' | 'ParameterDefinition' | 'User';

export function createRoutes<T extends Document, K extends ModelName>(
  model: Model<T>,
  modelName: K
) {
  const router = Router();

  const handleErrors = (res: Response, error: any) => {
    console.error(`Error in ${modelName} route:`, error);
    res.status(500).json({ error: `An error occurred while processing ${modelName.toLowerCase()}` });
  };

  const createOne: RouteHandler = async (req, res) => {
    try {
      const item = new model({
        ...req.body,
        created_by: req.user?.userId,
        updated_by: req.user?.userId
      });
      console.log('Item before save:', item);
      item._id = new Types.ObjectId();
      const saved_item = await item.save();
      console.log('Item after save:', saved_item);
      res.status(201).json(saved_item);
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

  const updateOne: RouteHandler = async (req, res) => {
    try {
      const item = await model.findOneAndUpdate(
        { _id: req.params.id, created_by: req.user?.userId },
        { ...req.body, updated_by: req.user?.userId },
        { new: true, runValidators: true }
      );
      if (!item) {
        res.status(404).json({ error: `${modelName} not found` });
        return;
      }
      res.status(200).json(item);
    } catch (error) {
      handleErrors(res, error);
    }
  };

  const deleteOne: RouteHandler = async (req, res) => {
    try {
      const item = await model.findOneAndDelete({ _id: req.params.id, created_by: req.user?.userId });
      if (!item) {
        res.status(404).json({ error: `${modelName} not found` });
        return;
      }
      res.status(200).json({ message: `${modelName} deleted successfully` });
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

  return router;
}