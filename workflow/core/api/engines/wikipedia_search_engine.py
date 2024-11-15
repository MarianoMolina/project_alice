import wikipedia
from typing import Dict, Any, List
from workflow.util import LOGGER
from workflow.core.data_structures import (
    References, ApiType, EntityReference, ReferenceCategory, ImageReference
    )
from workflow.core.api.engines.search_engine import APISearchEngine

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
        LOGGER.debug(f'search_results: {search_results} type: {type(search_results)}')
        detailed_results: List[wikipedia.WikipediaPage] = []
        for result in search_results[0]:
            try:
                page = wikipedia.page(title=result, auto_suggest=False)
                detailed_results.append(page)
            except wikipedia.exceptions.DisambiguationError as e:
                try:
                    # Use the first option from the disambiguation list
                    page = wikipedia.page(title=e.options[0], auto_suggest=False)
                    detailed_results.append(page)
                except Exception as ex:
                    LOGGER.warning(f"Failed to retrieve page for disambiguation option: {e.options[0]}, error: {ex}")
            except Exception as ex:
                LOGGER.warning(f"Failed to retrieve page for title: {result}, error: {ex}")
        if not detailed_results:
            raise ValueError("No results found")
        
        # Create EntityReferences using create_entity_from_data
        entity_references = [self.create_entity_from_data(page) for page in detailed_results]
        return References(entity_references=entity_references)
    
    def create_entity_from_data(self, page: wikipedia.WikipediaPage) -> EntityReference:
        # Expanded category mapping
        category_mapping = {
            'Living people': ReferenceCategory.PERSON,
            'Births': ReferenceCategory.PERSON,
            'Deaths': ReferenceCategory.PERSON,
            'Musicians': ReferenceCategory.PERSON,
            'Actors': ReferenceCategory.PERSON,
            'Politicians': ReferenceCategory.PERSON,
            'Films': ReferenceCategory.WORK,
            'Albums': ReferenceCategory.WORK,
            'Songs': ReferenceCategory.WORK,
            'Books': ReferenceCategory.WORK,
            'Companies': ReferenceCategory.ORGANIZATION,
            'Organizations': ReferenceCategory.ORGANIZATION,
            'Universities and colleges': ReferenceCategory.ORGANIZATION,
            'Software': ReferenceCategory.TECHNOLOGY,
            'Video games': ReferenceCategory.WORK,
            'Cities': ReferenceCategory.LOCATION,
            'Countries': ReferenceCategory.LOCATION,
            'Continents': ReferenceCategory.LOCATION,
            'Sports': ReferenceCategory.EVENT,
            'Mathematics': ReferenceCategory.CONCEPT,
            'Physics': ReferenceCategory.CONCEPT,
            'Chemistry': ReferenceCategory.CONCEPT,
            'Biology': ReferenceCategory.CONCEPT,
            'Animals': ReferenceCategory.BIOLOGICAL_ENTITY,
            'Plants': ReferenceCategory.BIOLOGICAL_ENTITY,
            'Natural phenomena': ReferenceCategory.NATURAL_PHENOMENON,
            'Historical events': ReferenceCategory.EVENT,
            'Art movements': ReferenceCategory.CONCEPT,
            'Technological innovations': ReferenceCategory.TECHNOLOGY,
            'Internet culture': ReferenceCategory.CONCEPT,
            'Medical conditions': ReferenceCategory.CONCEPT,
            'Astronomical objects': ReferenceCategory.NATURAL_PHENOMENON,
            'Languages': ReferenceCategory.CONCEPT,
            'Mythology': ReferenceCategory.CONCEPT,
            'Philosophical concepts': ReferenceCategory.CONCEPT,
            'Religions': ReferenceCategory.CONCEPT,
        }
        
        # Initialize categories
        categories = []
        for cat in page.categories:
            for key, value in category_mapping.items():
                if key.lower() in cat.lower():
                    if value not in categories:
                        categories.append(value)
        if not categories:
            categories.append(ReferenceCategory.OTHER)
        
        # Extract images
        images = []
        for image_url in page.images:
            image = ImageReference(
                url = image_url,
            )
            images.append(image)
        
        # Create EntityReference
        entity = EntityReference(
            source_id=f"wikipedia:{page.pageid}",
            name=page.title,
            description=page.summary[:255] if page.summary else None,
            content=page.content,
            url=page.url,
            images=images,
            categories=categories,
            source=ApiType.WIKIPEDIA_SEARCH,
            metadata={
                'page_length': len(page.content),
                'last_edited': page.last_edited,
                'links': page.links,
                'references': page.references,
                'sections': page.sections,
            },
        )
        return entity    
