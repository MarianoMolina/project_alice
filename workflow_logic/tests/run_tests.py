import asyncio
from workflow_logic.tests.TestEnvironment import TestEnvironment
from workflow_logic.tests.DBTest import DBTests
from workflow_logic.tests.APITest import APITests
from workflow_logic.tests.ChatTest import ChatTests
from workflow_logic.api.db_app.initialization_data import DB_STRUCTURE

async def main():
    test_env = TestEnvironment()
    db_tests = DBTests()
    api_tests = APITests()
    chat_tests = ChatTests()

    await test_env.add_module(db_tests)
    await test_env.add_module(api_tests)
    await test_env.add_module(chat_tests)
    test_seetings = {
        "db_structure": DB_STRUCTURE,
        "verbose": True
    }
    results = await test_env.run(**test_seetings)
    print(f'Test results: {results.keys()}')

    return 'success'

if __name__ == "__main__":
    status = asyncio.run(main())
    exit(0 if status == 'success' else 1)