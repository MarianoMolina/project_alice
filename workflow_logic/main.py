def run_app():
    from workflow_logic.api_app import WORKFLOW_APP
    from workflow_logic.util.const import WORKFLOW_PORT
    import uvicorn
    uvicorn.run(WORKFLOW_APP, host="0.0.0.0", port=int(WORKFLOW_PORT))

if __name__ == "__main__":
    run_app()
