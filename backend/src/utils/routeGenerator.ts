import { Response, Router } from 'express';
import { Model, Document, Types } from 'mongoose';
import { AuthRequest } from '../interfaces/auth.interface';
import adminOnly from '../middleware/admin.middleware';
import Logger from './logger';
import { ModelName } from './collection.utils';
import { PopulationService } from './population.utils';

type RouteHandler = (req: AuthRequest, res: Response) => Promise<void>;

interface RouteOptions<T extends Document> {
  createItem?: (data: Partial<T>, userId: string) => Promise<T | null>;
  updateItem?: (id: string, data: Partial<T>, userId: string) => Promise<T | null>;
  deleteItem?: (id: string, userId: string) => Promise<T | null>;
  getItem?: (id: string, userId: string) => Promise<T | null>;
  getPopulatedItem?: (id: string, userId: string) => Promise<T | null>;
  getAllItems?: (userId: string) => Promise<T[]>;
  getAllPopulatedItems?: (userId: string) => Promise<T[]>;
}

export function createRoutes<T extends Document, K extends ModelName>(
  model: Model<T>,
  modelName: K,
  options: RouteOptions<T> = {},
  populationService: PopulationService = new PopulationService()
) {
  const router = Router();

  const handleErrors = (res: Response, error: any) => {
    Logger.error(`Error in ${modelName} route:`, error);
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
        saved_item = await model.findById({ _id: { $eq:item._id} });
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
        const updateData = { ...req.body, updated_by: req.user?.userId };
        updated_item = await model.findOneAndUpdate(
          { _id: req.params.id, created_by: req.user?.userId },
          { $set: updateData },
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
      let items: T[];
      if (options.getAllItems) {
        if (!req.user?.userId) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }
        items = await options.getAllItems(req.user?.userId);
      } else {
        items = await model.find({ created_by: req.user?.userId });
      }
      res.status(200).json(items);
    } catch (error) {
      handleErrors(res, error);
    }
  };

  const getAllPopulated: RouteHandler = async (req, res) => {
    try {
      let items: T[];
      if (options.getAllPopulatedItems) {
        if (!req.user?.userId) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }
        items = await options.getAllPopulatedItems(req.user?.userId);
      } else {
        if (!req.user?.userId) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }

        // First get all items for this user
        const unpopulatedItems = await model.find({ created_by: req.user?.userId }) as (T & { _id: Types.ObjectId })[];

        // Then populate each item using the PopulationService
        const populatedItems = await Promise.all(
          unpopulatedItems.map(item =>
            populationService.findAndPopulate(
              model,
              item._id,
              req.user!.userId
            )
          )
        ) as T[];

        // Now we know these are definitely of type T[]
        items = populatedItems.filter((item): item is NonNullable<T> => item !== null);
      }
      res.status(200).json(items);
    } catch (error) {
      handleErrors(res, error);
    } finally {
      populationService.clearCache();
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
      let item: T | null;
      if (options.getItem) {
        if (!req.user?.userId) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }
        item = await options.getItem(req.params.id, req.user?.userId);
      } else {
        item = await model.findOne({ _id: req.params.id, created_by: req.user?.userId });
      }
      if (!item) {
        res.status(404).json({ error: `${modelName} not found` });
        return;
      }
      res.status(200).json(item);
    } catch (error) {
      handleErrors(res, error);
    }
  };

  const getOnePopulated: RouteHandler = async (req, res) => {
    try {
      let item: T | null;

      if (!req.user?.userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      if (options.getPopulatedItem) {
        item = await options.getPopulatedItem(req.params.id, req.user?.userId);
      } else {
        item = await populationService.findAndPopulate(
          model,
          req.params.id,
          req.user.userId
        );
      }

      if (!item) {
        res.status(404).json({ error: `${modelName} not found` });
        return;
      }

      res.status(200).json(item);
    } catch (error) {
      handleErrors(res, error);
    } finally {
      populationService.clearCache();
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
  router.get('/populated', getAllPopulated);
  router.get('/all', adminOnly, getAllAdmin);
  router.get('/:id', getOne);
  router.get('/:id/populated', getOnePopulated);
  router.patch('/:id', updateOne);
  router.delete('/:id', deleteOne);
  router.get('/schema', getSchema);

  return router;
}