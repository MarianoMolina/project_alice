const express = require('express');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost/cv_generator', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Error connecting to MongoDB:', error.message));

// Routes
const userRouter = require('./routes/user');
const companyRouter = require('./routes/company');
const jobRoleRouter = require('./routes/jobRole');
const educationRouter = require('./routes/education');
const skillRouter = require('./routes/skill');
const skillConnectionRouter = require('./routes/skillConnection');
const jobRoleResponsibilityRouter = require('./routes/jobRoleResponsibility');
const jobRoleAccomplishmentRouter = require('./routes/jobRoleAccomplishment');
const personalInfoRouter = require('./routes/personalInfo');
const hobbyRouter = require('./routes/hobby');
const generatedCVRouter = require('./routes/generatedCV');

app.use('/api/users', userRouter);
app.use('/api/companies', companyRouter);
app.use('/api/job-roles', jobRoleRouter);
app.use('/api/educations', educationRouter);
app.use('/api/skills', skillRouter);
app.use('/api/skill-connections', skillConnectionRouter);
app.use('/api/job-role-responsibilities', jobRoleResponsibilityRouter);
app.use('/api/job-role-accomplishments', jobRoleAccomplishmentRouter);
app.use('/api/personal-info', personalInfoRouter);
app.use('/api/hobbies', hobbyRouter);
app.use('/api/generated-cvs', generatedCVRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});