import app from './app';

const port = process.env.BACKEND_PORT || 3000;

console.log('MongoDB URI:', process.env.MONGODB_URI);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});