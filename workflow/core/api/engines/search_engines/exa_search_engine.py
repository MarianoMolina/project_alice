from exa_py import Exa
from exa_py.api import Result as ExaResult
from typing import Dict, Any
from workflow.util import LOGGER
from workflow.core.data_structures import (
    References, ApiType, EntityReference, ReferenceCategory, ImageReference
    )
from workflow.core.api.engines.search_engines.search_engine import APISearchEngine

class ExaSearchAPI(APISearchEngine):
    """
    API engine for Exa Search.

    This class implements the Exa search functionality.

    Attributes:
        required_api (ApiType): Set to "exa_search".

    Note:
        Requires a valid API key in api_data.
    """
    required_api: ApiType = ApiType.EXA_SEARCH

    async def generate_api_response(self, api_data: Dict[str, Any], prompt: str, max_results: int = 10, **kwargs) -> References:
        if not api_data.get('api_key'):
            raise ValueError("Exa API key not found in API data")
        
        exa_api = Exa(api_key=api_data['api_key'])
        exa_search = exa_api.search(query=prompt, num_results=max_results)
        LOGGER.debug(f'exa_search: {exa_search.results}')
        results = exa_search.results
        autoprompt_string = exa_search.autoprompt_string
        references = [self.create_entity_from_data(result, autoprompt_string) for result in results]
        return References(entity_references=references)
    
    def create_entity_from_data(self, result_data: ExaResult, autoprompt_string: str = '') -> EntityReference:
        # Safely access Result object properties using getattr
        content_parts = []
        
        highlights = getattr(result_data, 'highlights', None)
        if highlights:
            content_parts.append(f'# Highlights: {highlights}')
        
        text = getattr(result_data, 'text', None)
        if text:
            content_parts.append(f'# Text: {text}')
        
        content = '\n'.join(content_parts) if content_parts else ''
        
        # Safely handle image
        image_url = getattr(result_data, 'image', None)
        image = ImageReference(url=image_url) if image_url else None
        
        # Safely handle subpages
        subpages = getattr(result_data, 'subpages', None)
        subpage_entities = ([self.create_entity_from_data(subpage) for subpage in subpages] 
                          if subpages else None)
        
        # Create extras dictionary with only existing attributes
        standard_fields = {
            "id", "title", "summary", "url", "author", 
            "published_date", "score", "subpages"
        }
        
        # Safely get all available attributes
        extras = {}
        for key in dir(result_data):
            if (not key.startswith('_') and 
                key not in standard_fields and 
                hasattr(result_data, key)):
                extras[key] = getattr(result_data, key)
        
        entity = EntityReference(
            source_id=f'exa:{result_data.id}',
            name=result_data.title,
            description=getattr(result_data, 'summary', None),
            images=[image] if image else [],
            content=content,
            url=result_data.url,
            categories=[ReferenceCategory.URL],
            source=ApiType.EXA_SEARCH,
            metadata={
                'author': getattr(result_data, 'author', None),
                'published_date': getattr(result_data, 'published_date', None),
                'exa_score': getattr(result_data, 'score', None),
                'subpages': subpage_entities,
                'extras': extras,
                'autoprompt_string': autoprompt_string
            },
        )
        return entity