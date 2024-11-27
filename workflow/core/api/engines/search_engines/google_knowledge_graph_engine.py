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
    EntityReference, 
    ReferenceCategory, 
    ImageReference
)
from workflow.util import LOGGER

ALLOWED_TYPES = [
    "book", "bookseries", "educationalorganization", "event", "governmentorganization",
    "localbusiness", "movie", "movieseries", "musicalbum", "musicgroup", "musicrecording",
    "organization", "periodical", "person", "place", "sportsteam", "tvepisode", "tvseries",
    "videogame", "videogameseries", "website", "thing"
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

        entity_references = []

        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(url) as resp:
                    if resp.status != 200:
                        error_text = await resp.text()
                        LOGGER.error(f"Error from API: {resp.status} {error_text}")
                        raise Exception(f"API request failed with status {resp.status}")
                    response_data = await resp.json()

                    # Parse the response and create EntityReference objects
                    for element in response_data.get('itemListElement', []):
                        try:
                            result = element.get('result', {})
                            entity_reference = self.create_entity_from_data(result)
                            entity_references.append(entity_reference)
                        except Exception as e:
                            LOGGER.error(f"Error parsing entity data: {e} -> {element}")
                            continue
            except Exception as e:
                LOGGER.error(f"Error fetching data for query '{query}': {e}")
                raise

        return References(entity_references=entity_references)
    
    def create_entity_from_data(self, data: dict) -> EntityReference:
        # Complete type mapping from GKG types to ReferenceCategory
        type_mapping = {
            "book": ReferenceCategory.WORK,
            "bookseries": ReferenceCategory.WORK,
            "educationalorganization": ReferenceCategory.ORGANIZATION,
            "event": ReferenceCategory.EVENT,
            "governmentorganization": ReferenceCategory.ORGANIZATION,
            "localbusiness": ReferenceCategory.ORGANIZATION,
            "movie": ReferenceCategory.WORK,
            "movieseries": ReferenceCategory.WORK,
            "musicalbum": ReferenceCategory.WORK,
            "musicgroup": ReferenceCategory.ORGANIZATION,
            "musicrecording": ReferenceCategory.WORK,
            "organization": ReferenceCategory.ORGANIZATION,
            "periodical": ReferenceCategory.WORK,
            "person": ReferenceCategory.PERSON,
            "place": ReferenceCategory.LOCATION,
            "sportsteam": ReferenceCategory.ORGANIZATION,
            "tvepisode": ReferenceCategory.WORK,
            "tvseries": ReferenceCategory.WORK,
            "videogame": ReferenceCategory.WORK,
            "videogameseries": ReferenceCategory.WORK,
            "website": ReferenceCategory.URL,
            "thing": ReferenceCategory.OTHER,
        }
        
        # Map GKG types to ReferenceCategory
        categories = []
        for gkg_type in data.get('@type', []):
            gkg_type_lower = gkg_type.lower()
            category = type_mapping.get(gkg_type_lower, ReferenceCategory.OTHER)
            if category not in categories:
                categories.append(category)
        
        # Extract content from detailedDescription.articleBody
        detailed_description = data.get('detailedDescription', {})
        content = detailed_description.get('articleBody')
        content_url = detailed_description.get('url')
        content_license = detailed_description.get('license')
        
        # Extract images
        images = []
        image_data = data.get('image', {})
        if image_data:
            image_url = image_data.get('contentUrl') or image_data.get('url')
            license_url = image_data.get('license')
            if image_url:
                image = ImageReference(
                    url=image_url,
                    caption=None,
                    license=license_url
                )
                images.append(image)
        
        # Extract resultScore
        result_score = data.get('resultScore')
        
        # Create the EntityReference instance
        entity = EntityReference(
            source_id=data.get('@id'),
            name=data.get('name'),
            description=data.get('description'),
            content=content,
            url=data.get('url'),
            images=images,
            categories=categories,
            source=ApiType.GOOGLE_KNOWLEDGE_GRAPH,
            metadata={
                "gkg_result_score": result_score,
                "detailed_description_url": content_url,
                "detailed_description_license": content_license
            }
        )
        
        return entity
