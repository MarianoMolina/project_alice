import praw, wikipedia, arxiv
from exa_py import Exa
from praw.models import Submission
from googleapiclient.discovery import build
from typing import Tuple, List
from pydantic import Field
from abc import abstractmethod
from workflow_logic.util.task_utils import FunctionParameters, ParameterDefinition, SearchResult, SearchOutput, TaskResponse
from workflow_logic.util.const import REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, GOOGLE_API_KEY, GOOGLE_CSE_ID, EXA_API_KEY
from workflow_logic.core.tasks.task import AliceTask

class APITask(AliceTask):
    def run(self, **kwargs) -> TaskResponse:
        try:
            task_outputs, detailed_results = self.generate_api_response(**kwargs)
            return TaskResponse(
                task_name=self.task_name,
                task_description=self.task_description,
                status="complete",
                result_code=0,
                task_outputs=task_outputs,
                result_diagnostic="",
                task_content=detailed_results,
                execution_history=kwargs.get("execution_history", [])
            )
        except Exception as e:
            return TaskResponse(
                task_name=self.task_name,
                task_description=self.task_description,
                status="failed",
                result_code=1,
                result_diagnostic=str(e),
                execution_history=kwargs.get("execution_history", [])
            )
        
    @abstractmethod
    def generate_api_response(self, **kwargs) -> Tuple[SearchOutput, SearchOutput]:
        """Generates the API response for the task, in a tuple of the output and the content."""
        ...

reddit_search_parameters = FunctionParameters(
    type="object",
    properties={
        "prompt": ParameterDefinition(
            type="string",
            description="The search query.",
            default=None
        ),
        "sort": ParameterDefinition(
            type="string",
            description="Sort method, one of: 'relevance', 'hot', 'top', 'new', or 'comments'.",
            default="hot"
        ),
        "time_filter": ParameterDefinition(
            type="string",
            description="Time period to filter by, one of: 'all', 'day', 'hour', 'month', 'week', or 'year'.",
            default="week"
        ),
        "subreddit": ParameterDefinition(
            type="string",
            description="Name of the subreddit, like 'all' for r/all.",
            default="all"
        ),
        "limit": ParameterDefinition(
            type="integer",
            description="Maximum number of results to return.",
            default=10
        )
    },
    required=["prompt"]
)
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

class RedditSearchTask(APITask):
    task_name: str = "reddit_search"
    task_description: str = "Performs a Reddit search and retrieves results"
    input_variables: FunctionParameters = Field(reddit_search_parameters, description="This task requires a prompt input, and optional inputs such as sort, time_filter, subreddit, and limit. Default is 'hot', 'week', 'all', and 10.")
      
    def generate_api_response(self, prompt: str, sort: str = "hot", time_filter: str = "week", subreddit: str = "all", limit: int = 10, **kwargs) -> Tuple[SearchOutput, SearchOutput]:
        user_agent = "Alice_Assistant"
        reddit = praw.Reddit(
            client_id=REDDIT_CLIENT_ID,
            client_secret=REDDIT_CLIENT_SECRET,
            user_agent=user_agent,
        )
        subredditObject = reddit.subreddit(subreddit)
        search_results = subredditObject.search(query=prompt, sort=sort, time_filter=time_filter, limit=limit)
        submissions: List[Submission] = [submission for submission in search_results]
        search_result_list = [
            SearchResult(
            title=submission.title, 
            url=submission.url, 
            content=submission.selftext, 
            metadata={key: getattr(submission, key) for key in vars(submission) if key not in {"title", "url", "selftext"}}
        ) for submission in submissions]
        task_outputs = SearchOutput(content=search_result_list)
        return task_outputs, task_outputs
        
class APISearchTask(APITask):
    input_variables: FunctionParameters = Field(search_task_parameters, description="This task requires a prompt input and optionally a max_results int for the number of results to return, default is 10.")
        
class WikipediaSearchTask(APISearchTask):
    task_name: str = "wikipedia_search"
    task_description: str = "Performs a Wikipedia search and retrieves results"
    
    def generate_api_response(self, prompt: str, max_results: int = 10, **kwargs) -> Tuple[SearchOutput, SearchOutput]:
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
        return task_outputs, task_outputs

class GoogleSearchTask(APISearchTask):
    task_name: str = "google_search"
    task_description: str = "Performs a Google search and retrieves results"

    def generate_api_response(self, prompt: str, max_results: int = 10, **kwargs) -> Tuple[SearchOutput, SearchOutput]:
        api_key = GOOGLE_API_KEY
        cse_id = GOOGLE_CSE_ID
        service = build("customsearch", "v1", developerKey=api_key)
        res = service.cse().list(q=prompt, cx=cse_id, num=max_results).execute()
        results = res.get('items', [])
        task_content = SearchOutput(content=[
            SearchResult(
                title=result['title'],
                url=result['link'],
                content=result['snippet'],
                metadata={key: value for key, value in result.items() if key not in {"title", "link", "snippet"}}
            ) for result in results
        ])
        return task_content, task_content

class ExaSearchTask(APISearchTask):
    task_name: str = "exa_search"
    task_description: str = "Performs an Exa search and retrieves results"
        
    def generate_api_response(self, prompt: str, max_results: int = 10, **kwargs) -> Tuple[SearchOutput, SearchOutput]:
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
        return task_outputs, task_outputs
    
class ArxivSearchTask(APISearchTask):
    task_name: str = "arxiv_search"
    task_description: str = "Performs an Arxiv search and retrieves results"

    def generate_api_response(self, prompt: str, max_results: int = 10, **kwargs) -> Tuple[SearchOutput, SearchOutput]:
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
        return task_outputs, task_outputs
