import app from './app';
import { PORT } from './utils/const';
import Logger from './utils/logger';

app.listen(PORT, () => {
    Logger.info(`Server running on port ${PORT}`);
});