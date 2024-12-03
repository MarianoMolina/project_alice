from pydantic import Field
from workflow.core.data_structures import (
    FunctionParameters, ParameterDefinition
    )
from workflow.core.api.engines.api_engine import APIEngine

class APISearchEngine(APIEngine):
    """
    Base class defining the standard interface for search-based APIs.
    
    Establishes a common foundation for various search implementations
    (web search, knowledge graphs, specialized databases, etc.) with
    a unified set of parameters. Features:
    - Flexible query parameters
    - Output format control
    - Result filtering and sorting
    
    Input Interface:
        - prompt: Search query text
        - max_results: Result count limit
        - units: Measurement system preference
        - format: Output format control
        - types: Entity type filtering
        - sort: Result ordering method
        - time_filter: Time-based filtering
        - subreddit: Platform-specific scope (e.g., for Reddit)
    
    Notes:
        - Acts as a template for specific search implementations
        - Provides consistent parameter handling across different search types
        - Supports both general and platform-specific parameters
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
            ),
            "units": ParameterDefinition(
                type="string",
                description="Unit system to use for measurements. 'metric' or 'imperial'. Default is 'metric'.",
                default="metric",
            ),
            "format": ParameterDefinition(
                type="string",
                description="Output format. Options are 'plaintext', 'image', 'html', 'json'. Default is 'plaintext'.",
                default="plaintext",
            ),
            "types": ParameterDefinition(
                type="string",
                description="An optional list of entity types to restrict the results. Provide as comma separated values. Types can be: Book, BookSeries, EducationalOrganization, Event, GovernmentOrganization, LocalBusiness, Movie, MovieSeries, MusicAlbum, MusicGroup, MusicRecording, Organization, Periodical, Person, Place, SportsTeam, TVEpisode, TVSeries, VideoGame, VideoGameSeries, WebSite",
                default=None,
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
        },
        required=["prompt"]
    ), description="This inputs this API engine takes: requires a prompt input, and optional inputs such as max_results. Default is 10.")
    