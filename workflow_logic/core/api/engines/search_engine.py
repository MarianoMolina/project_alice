import wikipedia, praw
from praw.models import Submission, ListingGenerator, Subreddits
from arxiv import Result, Client, Search, SortCriterion
from googleapiclient.discovery import build
from exa_py import Exa
from pydantic import Field
from typing import Dict, Any, List
from workflow_logic.util import LOGGER
from workflow_logic.core.data_structures import URLReference, References, ApiType
from workflow_logic.core.parameters import FunctionParameters, ParameterDefinition
from workflow_logic.core.api.engines.api_engine import APIEngine

class APISearchEngine(APIEngine):
    """
    Base class for search-based API engines.

    This class extends APIEngine to provide a common structure for search APIs.
    It defines a standard set of input parameters suitable for most search operations.

    Attributes:
        input_variables (FunctionParameters): Defines the input structure for search operations,
                                              including 'prompt' and 'max_results'.
    """
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
    """
    API engine for searching Wikipedia.

    This class implements the Wikipedia search functionality, utilizing the wikipedia library.

    Attributes:
        required_api (ApiType): Set to "wikipedia_search".

    Note:
        This API does not require authentication, so api_data is not used in the generate_api_response method.
    """
    required_api: ApiType = "wikipedia_search"

    async def generate_api_response(self, api_data: Dict[str, Any], prompt: str, max_results: int = 10, **kwargs) -> References:
        # Wikipedia doesn't require API keys, so we don't need to use api_data
        search_results = wikipedia.search(prompt, results=max_results, suggestion=True)
        LOGGER.debug(f'search_results: {search_results} type: {type(search_results)} type of search_results[0]: {type(search_results[0])}')
        detailed_results = []
        for result in search_results[0]:
            try:
                detailed_results += [wikipedia.page(title=result, auto_suggest=False)]
            except wikipedia.exceptions.DisambiguationError as e:
                try:
                    detailed_results += [wikipedia.page(title=e.options[0], auto_suggest=False)]
                except:
                    pass
        if not detailed_results:
            raise ValueError("No results found")
        return References(search_results=[
            URLReference(
                title=result.title,
                url=result.url,
                content=result.summary,
                metadata={key: value for key, value in result.__dict__.items() if key not in {"title", "url", "summary"}}
            ) for result in detailed_results
        ])

class GoogleSearchAPI(APISearchEngine):
    """
    API engine for Google Custom Search.

    This class implements Google Custom Search functionality.

    Attributes:
        required_api (ApiType): Set to "google_search".

    Note:
        Requires valid API key and Custom Search Engine ID in api_data.
    """
    required_api: ApiType = "google_search"

    async def generate_api_response(self, api_data: Dict[str, Any], prompt: str, max_results: int = 10, **kwargs) -> References:
        if not api_data.get('api_key') or not api_data.get('cse_id'):
            raise ValueError("Google Search API key or CSE ID not found in API data")
        
        service = build("customsearch", "v1", developerKey=api_data['api_key'])
        res = service.cse().list(q=prompt, cx=api_data['cse_id'], num=max_results).execute()
        results = res.get('items', [])
        return References(search_results=[
            URLReference(
                title=result['title'],
                url=result['link'],
                content=result['snippet'],
                metadata={key: value for key, value in result.items() if key not in {"title", "link", "snippet"}}
            ) for result in results
        ])

class ExaSearchAPI(APISearchEngine):
    """
    API engine for Exa Search.

    This class implements the Exa search functionality.

    Attributes:
        required_api (ApiType): Set to "exa_search".

    Note:
        Requires a valid API key in api_data.
    """
    required_api: ApiType = "exa_search"

    async def generate_api_response(self, api_data: Dict[str, Any], prompt: str, max_results: int = 10, **kwargs) -> References:
        if not api_data.get('api_key'):
            raise ValueError("Exa API key not found in API data")
        
        exa_api = Exa(api_key=api_data['api_key'])
        exa_search = exa_api.search(query=prompt, num_results=max_results)
        LOGGER.debug(f'exa_search: {exa_search.results}')
        results = exa_search.results

        return References(search_results=[
            URLReference(
                title=result.title,
                url=result.url,
                content=f'Score: {result.score} - Published Date: {result.published_date} - Author: {result.author}',
                metadata={key: value for key, value in result.__dict__.items() if key not in {"title", "url", "score", "published_date", "author"}}
            ) for result in results
        ])

class ArxivSearchAPI(APISearchEngine):
    """
    API engine for arXiv Search.

    This class implements the arXiv search functionality.

    Attributes:
        required_api (ApiType): Set to "arxiv_search".

    Note:
        This API does not require authentication, so api_data is not used in the generate_api_response method.
    """
    required_api: ApiType = "arxiv_search"

    async def generate_api_response(self, api_data: Dict[str, Any], prompt: str, max_results: int = 10, **kwargs) -> References:
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

        return References(search_results=[
            URLReference(
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
    """
    API engine for Reddit Search.

    This class implements the Reddit search functionality with additional parameters
    for sorting and filtering results.

    Attributes:
        required_api (ApiType): Set to "reddit_search".
        input_variables (FunctionParameters): Defines the input structure for Reddit searches,
                                              including additional parameters like 'sort',
                                              'time_filter', and 'subreddit'.

    Note:
        Requires valid client ID and client secret in api_data.
    """
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

    async def generate_api_response(self, api_data: Dict[str, Any], prompt: str, sort: str = "hot", time_filter: str = "week", subreddit: str = "all", limit: int = 10, **kwargs) -> References:
        """
        Generate a response from a Reddit search.

        Args:
            api_data (Dict[str, Any]): Must contain 'client_id' and 'client_secret'.
            prompt (str): The search query.
            sort (str): Sort method for results. Defaults to "hot".
            time_filter (str): Time period to filter by. Defaults to "week".
            subreddit (str): Subreddit to search in. Defaults to "all".
            limit (int): Maximum number of results to return. Defaults to 10.

        Returns:
            References: A collection of URLReference objects containing Reddit submission information.

        Raises:
            ValueError: If client ID or client secret is missing from api_data.
        """
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
            URLReference(
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
        return References(search_results=search_result_list)