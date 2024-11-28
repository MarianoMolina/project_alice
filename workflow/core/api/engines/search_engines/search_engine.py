from pydantic import Field
from workflow.core.data_structures import (
    FunctionParameters, ParameterDefinition
    )
from workflow.core.api.engines.api_engine import APIEngine

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
    