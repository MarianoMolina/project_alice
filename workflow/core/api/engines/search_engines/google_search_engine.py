from googleapiclient.discovery import build
from typing import Dict, Any, List
from workflow.util import LOGGER
from workflow.core.data_structures import (
    References, ApiType, EntityReference, ReferenceCategory, ImageReference
    )    
from workflow.core.api.engines.search_engines.search_engine import APISearchEngine

class GoogleSearchAPI(APISearchEngine):
    """
    API engine for Google Custom Search.

    This class implements Google Custom Search functionality.

    Attributes:
        required_api (ApiType): Set to "google_search".

    Note:
        Requires valid API key and Custom Search Engine ID in api_data.
    """
    required_api: ApiType = ApiType.GOOGLE_SEARCH

    async def generate_api_response(self, api_data: Dict[str, Any], prompt: str, max_results: int = 10, **kwargs) -> References:
        if not api_data.get('api_key') or not api_data.get('cse_id'):
            raise ValueError("Google Search API key or CSE ID not found in API data")
        
        service = build("customsearch", "v1", developerKey=api_data['api_key'])
        res = service.cse().list(q=prompt, cx=api_data['cse_id'], num=max_results).execute()
        results = res.get('items', [])
        if not results:
            raise ValueError("No results found")

        # Create EntityReferences using create_entity_from_data
        entity_references = [self.create_entity_from_data(result) for result in results]
        return References(entity_references=entity_references)
    
    def create_entity_from_data(self, data: dict) -> EntityReference:
        # Extract basic information
        name = data.get('title')
        description = data.get('snippet')
        url = data.get('link')

        # Extract images from pagemap if available
        images = []
        pagemap = data.get('pagemap', {})
        if 'cse_image' in pagemap:
            for image_info in pagemap['cse_image']:
                image_url = image_info.get('src')
                if image_url and (image_url.startswith('http://') or image_url.startswith('https://')):
                    images.append(ImageReference(
                        url = image_url,
                    ))
                else: 
                    LOGGER.warning(f"Invalid image URL: {image_url}")

        # Determine categories based on pagemap data or content
        categories = self.determine_categories(data)

        # Collect additional metadata
        metadata = {key: value for key, value in data.items() if key not in {"title", "link", "snippet", "cse_image"}}

        # Create the EntityReference instance
        entity = EntityReference(
            source_id=f"google_search:{url}",
            name=name,
            description=description,
            url=url,
            images=images, 
            categories=categories, 
            source=ApiType.GOOGLE_SEARCH,
            metadata=metadata,
        )
        return entity

    def determine_categories(self, data: dict) -> List[ReferenceCategory]:
        # You can implement logic here to determine categories based on pagemap or other data
        pagemap = data.get('pagemap', {})
        categories = []

        # Example: Check if the result is an organization, person, etc.
        if 'organization' in pagemap:
            categories.append(ReferenceCategory.ORGANIZATION)
        elif 'person' in pagemap:
            categories.append(ReferenceCategory.PERSON)
        elif 'localbusiness' in pagemap:
            categories.append(ReferenceCategory.ORGANIZATION)
        elif 'product' in pagemap:
            categories.append(ReferenceCategory.TECHNOLOGY)
        elif 'article' in pagemap:
            categories.append(ReferenceCategory.CONCEPT)
        else:
            categories.append(ReferenceCategory.URL)  # Default category

        return categories
    