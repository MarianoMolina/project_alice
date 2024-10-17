import aiohttp
import urllib.parse
from pydantic import Field
from typing import Dict, Any, List, Optional
from workflow.core.api.engines import APIEngine
from workflow.core.data_structures import (
    References,
    FunctionParameters,
    ParameterDefinition,
    ApiType,
    URLReference
)
from workflow.util import LOGGER
ALLOWED_TYPES = [
    "book", "bookseries", "educationalorganization", "event", "governmentorganization",
    "localbusiness", "movie", "movieseries", "musicalbum", "musicgroup", "musicrecording",
    "organization", "periodical", "person", "place", "sportsteam", "tvepisode", "tvseries",
    "videogame", "videogameseries", "website"
]
class GoogleGraphEngine(APIEngine):
    """
    GoogleGraphEngine for searching a single entity using the Google Knowledge Graph Search API.

    This engine accepts a 'query' string representing the entity to search for,
    and an optional list of 'types' to restrict the results to specific entity types.
    """

    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "query": ParameterDefinition(
                    type="string",
                    description="The entity to search for in the Knowledge Graph.",
                ),
                "types": ParameterDefinition(
                    type="string",
                    description="An optional list of entity types to restrict the results. Provide as comma separated values. Types can be: Book, BookSeries, EducationalOrganization, Event, GovernmentOrganization, LocalBusiness, Movie, MovieSeries, MusicAlbum, MusicGroup, MusicRecording, Organization, Periodical, Person, Place, SportsTeam, TVEpisode, TVSeries, VideoGame, VideoGameSeries, WebSite",
                    default=None,
                ),
                "limit": ParameterDefinition(
                    type="integer",
                    description="Limits the number of entities to be returned. Maximum is 500. Default is 10.",
                    default=10,
                ),
            },
            required=["query"],
        ),
        description="Inputs: 'query' string for the entity, optional 'types' list, and optional 'limit'.",
    )

    required_api: ApiType = Field(ApiType.GOOGLE_KNOWLEDGE_GRAPH, title="The API engine required")

    async def generate_api_response(
        self,
        api_data: Dict[str, Any],
        query: str,
        types: Optional[List[str]] = None,
        limit: Optional[int] = 10,
        **kwargs,
    ) -> References:
        """
        Generates the API response using the Google Knowledge Graph Search API.

        Args:
            api_data (Dict[str, Any]): Configuration data for the API (e.g., API key).
            query (str): The entity to search for.
            types (Optional[List[str]]): An optional list of entity types to restrict the results.
            limit (Optional[int]): Limits the number of entities to be returned. Max is 500. Default is 10.
            **kwargs: Additional keyword arguments.

        Returns:
            References: A References object containing the search results.
        """
        api_key = api_data.get('api_key')
        if not api_key:
            raise ValueError("API key not found in API data")

        # Validate 'limit'
        if limit > 500 or limit < 1:
            raise ValueError("Limit must be between 1 and 500")

        # Prepare the API request parameters
        params = {
            'query': query,
            'limit': limit,
            'key': api_key,
            'indent': True,
        }
        if types:
            type_list = [t.strip().lower() for t in types.split(',')]
            invalid_types = set(type_list) - set(ALLOWED_TYPES)
            if invalid_types:
                LOGGER.warning(f"Invalid types provided: {', '.join(invalid_types)}")
            valid_types = [t for t in type_list if t in ALLOWED_TYPES]
            if valid_types:
                # Capitalize the first letter of each word for the API request
                params['types'] = ','.join(t.title() for t in valid_types)

        # Build the URL with encoded parameters
        service_url = 'https://kgsearch.googleapis.com/v1/entities:search'
        url = service_url + '?' + urllib.parse.urlencode(params, doseq=True)

        search_results = []

        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(url) as resp:
                    if resp.status != 200:
                        error_text = await resp.text()
                        LOGGER.error(f"Error from API: {resp.status} {error_text}")
                        raise Exception(f"API request failed with status {resp.status}")
                    response_data = await resp.json()

                    # Parse the response and create URLReference objects
                    for element in response_data.get('itemListElement', []):
                        result = element.get('result', {})
                        # Extract required fields
                        title = result.get('name', None)
                        result_url = result.get('url', None)
                        content = result.get('detailedDescription', {}).get('articleBody', None)
                        metadata = {
                            'id': result.get('@id', ''),
                            'description': result.get('description', ''),
                            'types': result.get('@type', []),
                            'resultScore': element.get('resultScore', 0),
                            'detailedDescription': result.get('detailedDescription', {}),
                            'image': result.get('image', {}),
                        }
                        url_ref = URLReference(
                            title=title if title else "No name",
                            url=result_url if result_url else "No url",
                            content=content if content else "No content",
                            metadata=metadata,
                        )
                        search_results.append(url_ref)
            except Exception as e:
                LOGGER.error(f"Error fetching data for query '{query}': {e}")
                raise

        return References(search_results=search_results)