import wikipedia
import praw
from praw.models import Submission, ListingGenerator, Subreddits
from arxiv import Result, Client, Search, SortCriterion
from exa_py import Exa
from abc import abstractmethod
from pydantic import BaseModel, Field
from googleapiclient.discovery import build
from workflow_logic.core.communication import SearchResult, SearchOutput
from workflow_logic.core.api import ApiType
from workflow_logic.core.parameters import FunctionParameters, ParameterDefinition
from typing import Dict, Any, List

class APIEngine(BaseModel):
    input_variables: FunctionParameters = Field(..., description="This inputs this API engine takes: requires a prompt input, and optional inputs such as sort, time_filter, subreddit, and limit. Default is 'hot', 'week', 'all', and 10.")
    required_api: ApiType = Field(..., title="The API engine required")

    @abstractmethod
    async def generate_api_response(self, api_data: Dict[str, Any], **kwargs) -> SearchOutput:
        """Generates the API response for the task, using the provided API data."""
        pass

class APISearchEngine(APIEngine):
    input_variables: FunctionParameters = Field(FunctionParameters(
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
), description="This inputs this API engine takes: requires a prompt input, and optional inputs such as max_results. Default is 10.")

class WikipediaSearchAPI(APISearchEngine):
    required_api: ApiType = "wikipedia_search"

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

class GoogleSearchAPI(APISearchEngine):
    required_api: ApiType = "google_search"

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

class ExaSearchAPI(APISearchEngine):
    required_api: ApiType = "exa_search"

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

class ArxivSearchAPI(APISearchEngine):
    required_api: ApiType = "arxiv_search"

    async def generate_api_response(self, api_data: Dict[str, Any], prompt: str, max_results: int = 10, **kwargs) -> SearchOutput:
        # arXiv doesn't require API keys, so we don't need to use api_data
        client = Client(page_size=20)
        print(f'prompt: {prompt}')
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
    
class RedditSearchAPI(APIEngine):
    input_variables: FunctionParameters = Field(FunctionParameters(
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
    ), description="This inputs this API engine takes: requires a prompt input, and optional inputs such as sort, time_filter, subreddit, and limit. Default is 'hot', 'week', 'all', and 10.")
    required_api: ApiType = "reddit_search"

    async def generate_api_response(self, api_data: Dict[str, Any], prompt: str, sort: str = "hot", time_filter: str = "week", subreddit: str = "all", limit: int = 10, **kwargs) -> SearchOutput:
        if not api_data.get('client_id') or not api_data.get('client_secret'):
            raise ValueError("Reddit client ID or client secret not found in API data")

        user_agent = "Alice_Assistant"
        # <platform>:<app ID>:<version string> (by u/<Reddit username>)
        # Example: "windows:com.example.myredditapp:v1.2.3 (by u/username)"
        reddit = praw.Reddit(
            client_id=api_data['client_id'],
            client_secret=api_data['client_secret'],
            user_agent=user_agent,
        )
        subredditObject: Subreddits = reddit.subreddit(subreddit)
        search_results: ListingGenerator = subredditObject.search(query=prompt, limit=int(limit), params={"sort": sort, "time_filter": time_filter})
        submissions: List[Submission] = [submission for submission in search_results]

        search_result_list = [
            SearchResult(
                title=submission.title,
                url=submission.url,
                content=submission.selftext,
                metadata={
                    "author": submission.author.name,
                    "created_utc": submission.created_utc,
                    "score": submission.score,
                    "upvote_ratio": submission.upvote_ratio,
                    "num_comments": submission.num_comments,
                    "subreddit": submission.subreddit.display_name,
                    "permalink": submission.permalink
                }
            ) for submission in submissions
        ]
        return SearchOutput(content=search_result_list)