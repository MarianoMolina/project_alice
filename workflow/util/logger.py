import logging
import os
from logging.handlers import RotatingFileHandler
from workflow.util.const import LOGGING_FOLDER, LOG_LEVEL

def setup_logging(log_level=logging.WARNING) -> logging.Logger:
    # Create logs directory if it doesn't exist
    workflow_log_dir = os.path.join(LOGGING_FOLDER, 'workflow')
    if not os.path.exists(workflow_log_dir):
        os.makedirs(workflow_log_dir)

    # Set up root logger
    logger = logging.getLogger()
    logger.setLevel(log_level)

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)

    # File handler
    file_handler = RotatingFileHandler(
        os.path.join(workflow_log_dir, 'app.log'),
        maxBytes=10*1024*1024,
        backupCount=10
    )
    file_handler.setLevel(log_level)

    # Create formatter and add it to the handlers
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    console_handler.setFormatter(formatter)
    file_handler.setFormatter(formatter)

    # Add the handlers to the logger
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

    return logger

LOGGER = setup_logging(getattr(logging, LOG_LEVEL))