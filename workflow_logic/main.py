def run_app():
    from workflow_logic.api import api_app
    from workflow_logic.util.const import WORKFLOW_PORT
    import uvicorn
    uvicorn.run(api_app, host="0.0.0.0", port=int(WORKFLOW_PORT))

if __name__ == "__main__":
#     import json
#     from workflow_logic.core.tasks import available_tasks
#     json_tasks = {task.task_name: task.model_dump() for task in available_tasks}
#     with open("tasks.json", "w", encoding='utf-8') as f:
#         json.dump(json_tasks, f, ensure_ascii=False, indent=4)
    # test_database_task_response_serialization()
    run_app()
