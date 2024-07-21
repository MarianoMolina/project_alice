import asyncio
import json
import os
from datetime import datetime
from pydantic import BaseModel
from typing import Dict, Any
from workflow_logic.tests.component_tests.test_environment import TestEnvironment
from workflow_logic.tests.component_tests.db_test import DBTests
from workflow_logic.tests.component_tests.api_test import APITests
from workflow_logic.tests.component_tests.chat_tests import ChatTests
from workflow_logic.tests.component_tests.task_test import TaskTests
from workflow_logic.db_app.initialization_data import DB_STRUCTURE
 
async def main():
    test_env = TestEnvironment()
    db_tests = DBTests()
    api_tests = APITests()
    chat_tests = ChatTests()
    task_tests = TaskTests()
    await test_env.add_module(db_tests)
    await test_env.add_module(api_tests)
    # await test_env.add_module(chat_tests)
    # await test_env.add_module(task_tests)
    results = await test_env.run(db_structure=DB_STRUCTURE, verbose=True)
    print(f'Test results: {results.keys()}')
    # Save results to a JSON file
    save_results_to_json(results)
    return 'success'

def serialize_for_json(obj: Any) -> Any:
    if isinstance(obj, BaseModel):
        return obj.model_dump(by_alias=True)
    elif isinstance(obj, dict):
        return {k: serialize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [serialize_for_json(i) for i in obj]
    return obj

def save_results_to_json(results: Dict[str, Any]):
    # Create the test_results directory if it doesn't exist
    os.makedirs('workflow_logic/tests/test_results', exist_ok=True)
    print(f'Saving test results to JSON file...')

    # Generate the filename with datetime identifier
    datetime_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f'workflow_logic/tests/test_results/results_{datetime_str}.json'

    for key, value in results.items():
        if 'outputs' in value:
            value.pop('outputs')
    # Serialize results for JSON
    serialized_results = serialize_for_json(results)

    # Save the results to the JSON file
    with open(filename, 'w') as file:
        json.dump(serialized_results, file, indent=4)

    print(f'Test results saved to {filename}')

if __name__ == "__main__":
    status = asyncio.run(main())
    exit(0 if status == 'success' else 1)