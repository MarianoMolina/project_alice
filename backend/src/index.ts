import app from './app';
import Logger from './utils/logger';

const port = process.env.BACKEND_PORT || 3000;

Logger.info('MongoDB URI:', process.env.MONGODB_URI);

app.listen(port, () => {
    Logger.info(`Server running on port ${port}`);
});