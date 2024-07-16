import wikipedia
import arxiv
from exa_py import Exa
from googleapiclient.discovery import build
from pydantic import Field
from workflow_logic.core.communication import SearchResult, SearchOutput
from workflow_logic.core.tasks.api_tasks.api_task import APITask
from workflow_logic.core.parameters import ParameterDefinition, FunctionParameters
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
    required_apis: List[str] = ["wikipedia_search"]

    def generate_api_response(self, api_data: Dict[str, Any], prompt: str, max_results: int = 10, **kwargs) -> SearchOutput:
        # Wikipedia doesn't require API keys, so we don't need to use api_data
        search_results = wikipedia.search(prompt, results=max_results)
        detailed_results = [wikipedia.page(title=result, auto_suggest=False) for result in search_results]
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
    required_apis: List[str] = ["google_search"]

    def generate_api_response(self, api_data: Dict[str, Any], prompt: str, max_results: int = 10, **kwargs) -> SearchOutput:
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
    required_apis: List[str] = ["exa_search"]

    def generate_api_response(self, api_data: Dict[str, Any], prompt: str, max_results: int = 10, **kwargs) -> SearchOutput:
        if not api_data.get('api_key'):
            raise ValueError("Exa API key not found in API data")
        
        exa_api = Exa(api_key=api_data['api_key'])
        exa_search = exa_api.search(query=prompt, num_results=max_results)
        return SearchOutput(content=[
            SearchResult(
                title=result['title'],
                url=result['url'],
                content=result['snippet'],
                metadata={key: value for key, value in result.items() if key not in {"title", "url", "snippet"}}
            ) for result in exa_search.results
        ])

class ArxivSearchTask(APISearchTask):
    task_name: str = "arxiv_search"
    task_description: str = "Performs an Arxiv search and retrieves results"
    required_apis: List[str] = ["arxiv_search"]

    def generate_api_response(self, api_data: Dict[str, Any], prompt: str, max_results: int = 10, **kwargs) -> SearchOutput:
        # arXiv doesn't require API keys, so we don't need to use api_data
        client = arxiv.Client(page_size=20)
        search = arxiv.Search(
            query=prompt, 
            max_results=max_results,
            sort_by=arxiv.SortCriterion.SubmittedDate
        )
        results = list(client.results(search))
        return SearchOutput(content=[
            SearchResult(
                title=result.title,
                url=result.pdf_url,
                content=result.summary,
                metadata={key: getattr(result, key) for key in vars(result) if key not in {"title", "pdf_url", "summary"}}
            ) for result in results
        ])