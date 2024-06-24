def run_app():
    from workflow_logic.api import api_app
    from workflow_logic.util.const import WORKFLOW_PORT
    import uvicorn
    uvicorn.run(api_app, host="0.0.0.0", port=int(WORKFLOW_PORT))

if __name__ == "__main__":
    # from workflow_logic.core.tasks import available_tasks
    # for task in available_tasks:
    #     print(f"Task: {task.model_dump()}")
    run_app()
