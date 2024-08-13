import express from 'express';
import mongoose from 'mongoose';
import Logger from '../utils/logger';

const router = express.Router();

router.get('/', (req, res) => {
  if (mongoose.connection.readyState === 1) {
    res.status(200).json({ status: 'OK', message: 'NEW HEALTH CHECK - Service is healthy' });
  } else {
    Logger.error("Healthcheck failed");
    res.status(503).json({ 
      status: 'ERROR', 
      message: 'NEW HEALTH CHECK - Database connection is not established',
      connectionState: mongoose.connection.readyState,
    });
  }
});

export default router;