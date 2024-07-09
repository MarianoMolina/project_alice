import wikipedia, arxiv
from exa_py import Exa
from googleapiclient.discovery import build
from pydantic import Field
from workflow_logic.core.communication import SearchResult, SearchOutput
from workflow_logic.util.const import  GOOGLE_API_KEY, GOOGLE_CSE_ID, EXA_API_KEY
from workflow_logic.core.tasks.api_tasks.api_task import APITask
from workflow_logic.core.parameters import ParameterDefinition, FunctionParameters

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
    
    def generate_api_response(self, prompt: str, max_results: int = 10, **kwargs) -> SearchOutput:
        search_results = wikipedia.search(prompt, results=max_results)
        detailed_results = [wikipedia.page(title=result, auto_suggest=False) for result in search_results]
        task_outputs = SearchOutput(content=[
            SearchResult(
                title=result.title,
                url=result.url,
                content=result.summary,
                metadata={key: value for key, value in result.__dict__.items() if key not in {"title", "url", "summary"}}
            ) for result in detailed_results
        ])
        return task_outputs

class GoogleSearchTask(APISearchTask):
    task_name: str = "google_search"
    task_description: str = "Performs a Google search and retrieves results"

    def generate_api_response(self, prompt: str, max_results: int = 10, **kwargs) -> SearchOutput:
        api_key = GOOGLE_API_KEY
        cse_id = GOOGLE_CSE_ID
        service = build("customsearch", "v1", developerKey=api_key)
        res = service.cse().list(q=prompt, cx=cse_id, num=max_results).execute()
        results = res.get('items', [])
        task_outputs = SearchOutput(content=[
            SearchResult(
                title=result['title'],
                url=result['link'],
                content=result['snippet'],
                metadata={key: value for key, value in result.items() if key not in {"title", "link", "snippet"}}
            ) for result in results
        ])
        return task_outputs

class ExaSearchTask(APISearchTask):
    task_name: str = "exa_search"
    task_description: str = "Performs an Exa search and retrieves results"
        
    def generate_api_response(self, prompt: str, max_results: int = 10, **kwargs) -> SearchOutput:
        exa_api = Exa(api_key=EXA_API_KEY)
        exa_search = exa_api.search(query=prompt, num_results=max_results)
        task_outputs = SearchOutput(content=[
            SearchResult(
                title=result['title'],
                url=result['url'],
                content=result['snippet'],
                metadata={key: value for key, value in result.items() if key not in {"title", "url", "snippet"}}
            ) for result in exa_search.results
        ])
        return task_outputs
    
class ArxivSearchTask(APISearchTask):
    task_name: str = "arxiv_search"
    task_description: str = "Performs an Arxiv search and retrieves results"

    def generate_api_response(self, prompt: str, max_results: int = 10, **kwargs) -> SearchOutput:
        client = arxiv.Client(page_size=20)
        search = arxiv.Search(
            query=prompt, 
            max_results=max_results,
            sort_by = arxiv.SortCriterion.SubmittedDate)
        results = list(client.results(search))
        task_outputs = SearchOutput(content=[
            SearchResult(
                title=result.title,
                url=result.pdf_url,
                content=result.summary,
                metadata={key: getattr(result, key) for key in vars(result) if key not in {"title", "pdf_url", "summary"}}
            ) for result in results
        ])
        return task_outputs
