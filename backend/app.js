const express = require('express');
const mongoose = require('mongoose');
require('mongoose-schema-jsonschema')(mongoose); // Add the plugin here
require('dotenv').config();
const bodyParser = require('body-parser');
const ModelRoutes = require('./routes/models');
const AgentRoutes = require('./routes/agents');
const TaskRoutes = require('./routes/tasks');
const UserRoutes = require('./routes/users');
const collectionsRoutes = require('./routes/collections'); 
const promptRoutes = require('./routes/prompts');
const taskResultRouter = require('./routes/taskResult');
const cors = require('cors');

const app = express();
const port = process.env.BACKEND_PORT || 3000;

console.log('MongoDB URI:', process.env.MONGODB_URI); 

mongoose.connect(process.env.MONGODB_URI || "mongodb://mongo/alice_database", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Failed to connect to MongoDB', err);
});

// Make sure CORS is properly configured
const corsOptions = {
  origin: `http://localhost:${process.env.FRONTEND_PORT}`, // Adjust this to match your frontend URL
  optionsSuccessStatus: 200,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

app.use(bodyParser.json());

app.use('/api/models', ModelRoutes);
app.use('/api/agents', AgentRoutes);
app.use('/api/tasks', TaskRoutes);
app.use('/api/users', UserRoutes);
app.use('/api/collections', collectionsRoutes); 
app.use('/api/prompts', promptRoutes);
app.use('/api/taskResults', taskResultRouter);
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
