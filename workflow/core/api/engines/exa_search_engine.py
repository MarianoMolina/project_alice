from exa_py import Exa
from exa_py.api import Result as ExaResult
from typing import Dict, Any
from workflow.util import LOGGER
from workflow.core.data_structures import (
    References, ApiType, EntityReference, ReferenceCategory, ImageReference
    )
from workflow.core.api.engines.search_engine import APISearchEngine

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
        autoprompt_string = exa_search.autoprompt_string
        references = [self.create_entity_from_data(result, autoprompt_string) for result in results]
        return References(entity_references=references)
    
    def create_entity_from_data(self, result_data: ExaResult, autoprompt_string: str = '') -> EntityReference:
        # Map the result data to EntityReference fields
        content: str = f'# Highlights: {result_data.highlights}\n' if 'highlights' in result_data and result_data.highlights else ''
        content += f'# Text: {result_data.text}' if 'text' in result_data and result_data.text else ''
        image: ImageReference = ImageReference(url=result_data.image) if 'image' in result_data and result_data.image else None
        entity = EntityReference(
            source_id=f'exa:{result_data.id}',
            name=result_data.title,
            description=result_data.summary if 'summary' in result_data and result_data.summary else None,
            images=[image] if image else None,
            content=content,
            url=result_data.url,
            categories=[ReferenceCategory.URL], 
            source=ApiType.EXA_SEARCH,
            metadata={
                'author': result_data.author,
                'published_date': result_data.published_date,
                'exa_score': result_data.score,
                'subpages': [self.create_entity_from_data(subpage) for subpage in result_data.subpages] if 'subpages' in result_data and result_data.subpages else None,
                'extras': {
                    key: value for key, value in result_data.items() 
                    if key not in {"id", "title", "summary", "url", "author", "published_date", "score", "subpages"}
                    },
                'autoprompt_string': autoprompt_string
                },
        )
        return entity