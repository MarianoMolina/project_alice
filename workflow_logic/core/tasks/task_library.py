import logging
from typing import Dict, List
from pydantic import BaseModel, Field
from workflow_logic.core.agent.agent import AgentLibrary
from workflow_logic.core.tasks.task import AliceTask

class TaskLibrary(BaseModel):
    available_tasks: List[AliceTask] = Field([], description="A list of tasks to make available in the library on initialization")
    agent_library: AgentLibrary = Field(..., description="A library of agents available for task execution")
    tasks: Dict[str, AliceTask] = Field({}, description="A dictionary of tasks available in the library")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if self.available_tasks:
            self.add_tasks_in_batch(self.available_tasks)

    def add_task(self, task: AliceTask) -> bool:
        if not isinstance(task, AliceTask):
            logging.warning(f"Task {task} is not an instance of AliceTask. Skipping.")
            return False
        if not task.task_name:
            logging.warning(f"Task {task} does not have a task_name attribute. Skipping.")
            return False
        if task.task_name in self.tasks:
            logging.warning(f"Task {task.task_name} already exists in the task library. Skipping.")
            return False
        self.tasks[task.task_name] = task     
        return True

    def get_task(self, task_name: str) -> AliceTask:
        if task_name not in self.tasks:
            raise ValueError(f"Task {task_name} not found in the tasks dictionary.")
        return self.tasks[task_name]

    def remove_task(self, task_name: str):
        if task_name in self.tasks:
            del self.tasks[task_name]
            return True
        return False
    
    def add_tasks_in_batch(self, tasks: List[AliceTask]) -> bool:
        # This is bad -> workflows that have workflows inside them will not work
        for task in tasks:
            self.add_task(task)               
        return True