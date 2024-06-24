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
const chatRoutes = require('./routes/chats');
const corsMiddlewares = require('./middleware/corsConfig');

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
mongoose.set('debug', true);

// // Logging middleware
// app.use((req, res, next) => {
//   console.log(`Incoming request: ${req.method} ${req.url}`);
//   // console.log('Request headers:', req.headers);
//   res.on('finish', () => {
//     console.log(`Response status: ${res.statusCode}`);
//     // console.log('Response headers:', res.getHeaders());
//   });
//   next();
// });

// Apply the CORS middlewares
app.use(corsMiddlewares);

// Explicitly handle preflight requests
app.options('*', corsMiddlewares);

app.use(bodyParser.json());

app.use('/api/agents', AgentRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/collections', collectionsRoutes); 
app.use('/api/models', ModelRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/taskresults', taskResultRouter);
app.use('/api/tasks', TaskRoutes);
app.use('/api/users', UserRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
