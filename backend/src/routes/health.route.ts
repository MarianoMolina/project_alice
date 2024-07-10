import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/health', (req, res) => {
  // Check if the database connection is established
  if (mongoose.connection.readyState === 1) {
    res.status(200).json({ status: 'OK', message: 'Service is healthy' });
  } else {
    res.status(503).json({ status: 'ERROR', message: 'Database connection is not established' });
  }
});

export default router;