import logging
import os
from logging.handlers import RotatingFileHandler
from workflow_logic.util.const import LOGGING_FOLDER
from dotenv import load_dotenv
load_dotenv()

def setup_logging(log_level=logging.WARNING):
    # Create logs directory if it doesn't exist
    if not os.path.exists(LOGGING_FOLDER):
        os.makedirs(LOGGING_FOLDER)

    # Set up root logger
    logger = logging.getLogger()
    logger.setLevel(log_level)

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)

    # File handler
    file_handler = RotatingFileHandler(
        'logs/app.log', maxBytes=10*1024*1024, backupCount=5
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

# Environment variable to control log level
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOGGER = setup_logging(getattr(logging, LOG_LEVEL))