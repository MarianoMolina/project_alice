def run_app():
    from workflow_logic.api import api_app
    from workflow_logic.util.const import WORKFLOW_PORT
    import uvicorn
    uvicorn.run(api_app, host="0.0.0.0", port=WORKFLOW_PORT)

if __name__ == "__main__":
    run_app()