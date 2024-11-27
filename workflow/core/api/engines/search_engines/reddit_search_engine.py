import praw
from praw.models import Submission, ListingGenerator, Subreddits
from pydantic import Field
from typing import Dict, Any, List
from workflow.core.data_structures import (
    References, ApiType, FunctionParameters, ParameterDefinition, EntityReference, ReferenceCategory, ImageReference
    )
from workflow.core.api.engines.api_engine import APIEngine

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
            References: A collection of EntityReference objects containing Reddit submission information.

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
        submissions: ListingGenerator = subredditObject.search(query=prompt, limit=int(limit), params={"sort": sort, "time_filter": time_filter})
        submissions_list: List[Submission]  = list(submissions)
        if not submissions_list:
            raise ValueError("No results found")

        # Create EntityReferences using create_entity_from_data
        entity_references = [self.create_entity_from_data(submission) for submission in submissions_list]
        return References(entity_references=entity_references)
    
    def create_entity_from_data(self, data: Submission) -> EntityReference:
        # Extract basic information
        name = data.title
        content = data.selftext if data.selftext else ''
        url = f"https://www.reddit.com{data.permalink}"

        # Determine categories based on subreddit
        subreddit_name = data.subreddit.display_name.lower()
        category_mapping = {
            'news': ReferenceCategory.EVENT,
            'worldnews': ReferenceCategory.EVENT,
            'technology': ReferenceCategory.TECHNOLOGY,
            'science': ReferenceCategory.CONCEPT,
            'funny': ReferenceCategory.OTHER,
            'gaming': ReferenceCategory.WORK,
            'movies': ReferenceCategory.WORK,
            'music': ReferenceCategory.WORK,
            'books': ReferenceCategory.WORK,
            'sports': ReferenceCategory.EVENT,
            'askreddit': ReferenceCategory.CONCEPT,
            'art': ReferenceCategory.WORK,
            'history': ReferenceCategory.CONCEPT,
            'space': ReferenceCategory.NATURAL_PHENOMENON,
            'pics': ReferenceCategory.OTHER,
            'videos': ReferenceCategory.OTHER,
            'explainlikeimfive': ReferenceCategory.CONCEPT,
            'todayilearned': ReferenceCategory.CONCEPT,
        }
        category = category_mapping.get(subreddit_name, ReferenceCategory.OTHER)
        categories = [category]

        # Extract images if any
        images = []
        if hasattr(data, 'preview') and data.preview:
            preview = data.preview
            if 'images' in preview:
                for image_info in preview['images']:
                    source = image_info.get('source', {})
                    image_url = source.get('url')
                    if image_url:
                        images.append(ImageReference(
                            url = image_url,
                        ))
        # Check if submission URL is an image
        if data.url.endswith(('.jpg', '.jpeg', '.png', '.gif')):
            images.append(ImageReference(
                url = data.url,
                caption = data.title
            ))

        # Extract additional metadata
        metadata = {
            "author": data.author.name if data.author else None,
            "created_utc": data.created_utc,
            "score": data.score,
            "upvote_ratio": data.upvote_ratio,
            "num_comments": data.num_comments,
            "subreddit": data.subreddit.display_name,
            "permalink": data.permalink
        }

        # Create the EntityReference instance
        entity = EntityReference(
            source_id=f"reddit:{data.id}",
            name=name,
            content=content,
            url=url,
            images=images,
            categories=categories,
            source=ApiType.REDDIT_SEARCH,
            metadata=metadata,
        )
        return entity