import praw, wikipedia
from exa_py import Exa
from googleapiclient.discovery import build
from arxiv import Client, Search, SortCriterion
from typing import Dict, Any
from workflow_logic.test.component_tests.test_environment import TestModule
from workflow_logic.core.api import APIManager, API
from workflow_logic.core import AliceAgent
from workflow_logic.db_app import DBInitManager
from workflow_logic.util import ApiType

class APITests(TestModule):
    name: str = "APITests"

    async def run(self, db_init_manager: DBInitManager, **kwargs) -> Dict[str, Any]:
        test_results = {}
        available_apis = []
        api_manager = APIManager()

        # Retrieve all APIs from db_init_manager
        for api in db_init_manager.entity_obj_key_map.get("apis", {}).values():
            api: API = api
            api_manager.add_api(api)

            # Test each API
            test_result = await self.test_api(api, api_manager)
            test_results[api.api_name] = test_result

            if test_result == "Success":
                available_apis.append((api.api_type, api.api_name))

        return {
            "test_results": test_results,
            "outputs": {"available_apis": available_apis}
        }

    async def test_api(self, api: API, api_manager: APIManager) -> str:
        try:
            if api.api_type == ApiType.LLM_MODEL:
                return await self.test_llm_api(api, api_manager)
            elif api.api_type == ApiType.REDDIT_SEARCH:
                return await self.test_reddit_api(api)
            elif api.api_type == ApiType.EXA_SEARCH:
                return await self.test_exa_api(api)
            elif api.api_type == ApiType.GOOGLE_SEARCH:
                return await self.test_google_api(api)
            elif api.api_type == ApiType.WIKIPEDIA_SEARCH:
                return await self.test_wikipedia_api(api)
            elif api.api_type == ApiType.ARXIV_SEARCH:
                return await self.test_arxiv_api(api)
            else:
                return f"Unsupported API type: {api.api_type}"
        except Exception as e:
            return f"Error: {str(e)}"

    async def test_llm_api(self, api: API, api_manager: APIManager) -> str:
        try:
            agent = AliceAgent(name="Test Agent", model_id=api.default_model)
            autogen_agent = agent.get_autogen_agent(api_manager=api_manager)
            response = autogen_agent.generate_reply([{"role": "user", "content": "Hello, this is a test message."}])
            return "Success" if response else "Failed to generate response"
        except Exception as e:
            return f"Error: {str(e)}"

    async def test_reddit_api(self, api: API) -> str:
        try:
            reddit = praw.Reddit(
                client_id=api.api_config['client_id'],
                client_secret=api.api_config['client_secret'],
                user_agent="TestUserAgent"
            )
            subreddit = reddit.subreddit("all")
            next(subreddit.hot(limit=1))
            return "Success"
        except Exception as e:
            return f"Error: {str(e)}"

    async def test_exa_api(self, api: API) -> str:
        try:
            exa_api = Exa(api_key=api.api_config['api_key'])
            results = exa_api.search(query="test", num_results=1)
            return "Success" if results else "No results returned"
        except Exception as e:
            return f"Error: {str(e)}"

    async def test_google_api(self, api: API) -> str:
        try:
            service = build("customsearch", "v1", developerKey=api.api_config['api_key'])
            res = service.cse().list(q="test", cx=api.api_config['cse_id'], num=1).execute()
            return "Success" if res.get('items') else "No results returned"
        except Exception as e:
            return f"Error: {str(e)}"

    async def test_wikipedia_api(self, api: API) -> str:
        try:
            results = wikipedia.search("Python programming", results=1)
            return "Success" if results else "No results returned"
        except Exception as e:
            return f"Error: {str(e)}"

    async def test_arxiv_api(self, api: API) -> str:
        try:
            client = Client()
            search = Search(
                query="machine learning",
                max_results=1,
                sort_by=SortCriterion.SubmittedDate
            )
            results = list(client.results(search))
            return "Success" if results else "No results returned"
        except Exception as e:
            return f"Error: {str(e)}"