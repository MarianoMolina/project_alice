import os
import sys
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

def run_app():
    from workflow.util.logger import LOGGER
    from workflow.api_app import WORKFLOW_APP
    from workflow.util.const import WORKFLOW_PORT
    import uvicorn

    class LogConfig(uvicorn.Config):
        def configure_logging(self):
            logging_config = {
                "version": 1,
                "loggers": {
                    "uvicorn": {"logger": LOGGER},
                }
            }
            return logging_config

    config = LogConfig(WORKFLOW_APP, host="0.0.0.0", port=int(WORKFLOW_PORT))
    server = uvicorn.Server(config)
    server.run()

if __name__ == "__main__":
    run_app()