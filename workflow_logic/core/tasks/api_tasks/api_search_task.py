import wikipedia
from arxiv import Result, Client, Search, SortCriterion
from exa_py import Exa
from googleapiclient.discovery import build
from pydantic import Field
from workflow_logic.util import SearchResult, SearchOutput
from workflow_logic.core.tasks.api_tasks.api_task import APITask
from workflow_logic.core.parameters import ParameterDefinition, FunctionParameters
from workflow_logic.core.api import ApiType
from typing import Dict, Any, List

search_task_parameters = FunctionParameters(
    type="object",
    properties={
        "prompt": ParameterDefinition(
            type="string",
            description="The search query.",
            default=None
        ),
        "max_results": ParameterDefinition(
            type="integer",
            description="Maximum number of results to return.",
            default=10
        )
    },
    required=["prompt"]
)

class APISearchTask(APITask):
    input_variables: FunctionParameters = Field(search_task_parameters, description="This task requires a prompt input and optionally a max_results int for the number of results to return, default is 10.")

class WikipediaSearchTask(APISearchTask):
    task_name: str = "wikipedia_search"
    task_description: str = "Performs a Wikipedia search and retrieves results"
    required_apis: List[ApiType] = ["wikipedia_search"]

    async def generate_api_response(self, api_data: Dict[str, Any], prompt: str, max_results: int = 10, **kwargs) -> SearchOutput:
        # Wikipedia doesn't require API keys, so we don't need to use api_data
        search_results = wikipedia.search(prompt, results=max_results, suggestion=True)
        print(f'search_results: {search_results} type: {type(search_results)} type of search_results[0]: {type(search_results[0])}')
        detailed_results = [wikipedia.page(title=result, auto_suggest=False) for result in search_results[0]]
        return SearchOutput(content=[
            SearchResult(
                title=result.title,
                url=result.url,
                content=result.summary,
                metadata={key: value for key, value in result.__dict__.items() if key not in {"title", "url", "summary"}}
            ) for result in detailed_results
        ])

class GoogleSearchTask(APISearchTask):
    task_name: str = "google_search"
    task_description: str = "Performs a Google search and retrieves results"
    required_apis: List[ApiType] = ["google_search"]

    async def generate_api_response(self, api_data: Dict[str, Any], prompt: str, max_results: int = 10, **kwargs) -> SearchOutput:
        if not api_data.get('api_key') or not api_data.get('cse_id'):
            raise ValueError("Google Search API key or CSE ID not found in API data")
        
        service = build("customsearch", "v1", developerKey=api_data['api_key'])
        res = service.cse().list(q=prompt, cx=api_data['cse_id'], num=max_results).execute()
        results = res.get('items', [])
        return SearchOutput(content=[
            SearchResult(
                title=result['title'],
                url=result['link'],
                content=result['snippet'],
                metadata={key: value for key, value in result.items() if key not in {"title", "link", "snippet"}}
            ) for result in results
        ])

class ExaSearchTask(APISearchTask):
    task_name: str = "exa_search"
    task_description: str = "Performs an Exa search and retrieves results"
    required_apis: List[ApiType] = ["exa_search"]

    async def generate_api_response(self, api_data: Dict[str, Any], prompt: str, max_results: int = 10, **kwargs) -> SearchOutput:
        if not api_data.get('api_key'):
            raise ValueError("Exa API key not found in API data")
        
        exa_api = Exa(api_key=api_data['api_key'])
        exa_search = exa_api.search(query=prompt, num_results=max_results)
        print(f'exa_search: {exa_search.results}')
        results = exa_search.results

        return SearchOutput(content=[
            SearchResult(
                title=result.title,
                url=result.url,
                content=f'Score: {result.score} - Published Date: {result.published_date} - Author: {result.author}',
                metadata={key: value for key, value in result.__dict__.items() if key not in {"title", "url", "score", "published_date", "author"}}
            ) for result in results
        ])

class ArxivSearchTask(APISearchTask):
    task_name: str = "arxiv_search"
    task_description: str = "Performs an Arxiv search and retrieves results. The max_results specifies the number of pages, not of unique results. Each page contains 20 results."
    required_apis: List[ApiType] = ["arxiv_search"]

    async def generate_api_response(self, api_data: Dict[str, Any], prompt: str, max_results: int = 10, **kwargs) -> SearchOutput:
        # arXiv doesn't require API keys, so we don't need to use api_data
        client = Client(page_size=20)
        search = Search(
            query=prompt, 
            max_results=max_results,
            sort_by=SortCriterion.SubmittedDate
        )
        results: List[Result] = list(client.results(search))
        if not results:
            raise ValueError("No results found")

        return SearchOutput(content=[
            SearchResult(
                title=result.title,
                url=result.pdf_url,
                content=result.summary,
                metadata={
                    "updated": result.updated,
                    "published": result.published,
                    "authors": [author.name for author in result.authors],
                    "comment": result.comment,
                    "primary_category": result.primary_category,
                    "categories": result.categories,
                    "links": {link.rel: link.href for link in result.links}
                }
            ) for result in results
        ])