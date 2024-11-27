
from datetime import datetime
from arxiv import Result, Client, Search, SortCriterion
from typing import Dict, Any, List
from workflow.core.data_structures import (
    References, ApiType, EntityReference, ReferenceCategory
    )
from workflow.core.api.engines.search_engine import APISearchEngine

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

        entity_references = [self.create_entity_from_data(result) for result in results]
        return References(entity_references=entity_references)
    
    def create_entity_from_data(self, entry: Result) -> EntityReference:
        # Expanded category mapping
        category_mapping = {
            'cs': ReferenceCategory.TECHNOLOGY,
            'math': ReferenceCategory.CONCEPT,
            'physics': ReferenceCategory.CONCEPT,
            'astro-ph': ReferenceCategory.NATURAL_PHENOMENON,
            'cond-mat': ReferenceCategory.CONCEPT,
            'gr-qc': ReferenceCategory.CONCEPT,
            'hep-ex': ReferenceCategory.CONCEPT,
            'hep-lat': ReferenceCategory.CONCEPT,
            'hep-ph': ReferenceCategory.CONCEPT,
            'hep-th': ReferenceCategory.CONCEPT,
            'nucl-ex': ReferenceCategory.CONCEPT,
            'nucl-th': ReferenceCategory.CONCEPT,
            'quant-ph': ReferenceCategory.CONCEPT,
            'stat': ReferenceCategory.CONCEPT,
            'eess': ReferenceCategory.TECHNOLOGY,
            'q-bio': ReferenceCategory.BIOLOGICAL_ENTITY,
            'q-fin': ReferenceCategory.CONCEPT,
            'econ': ReferenceCategory.CONCEPT,
        }
        
        arxiv_categories: List[str] = entry.categories
        categories = []
        for cat in arxiv_categories:
            main_cat = cat.split('.')[0]
            category = category_mapping.get(main_cat, ReferenceCategory.CONCEPT)
            if category not in categories:
                categories.append(category)
        if not categories:
            categories.append(ReferenceCategory.OTHER)
        
        metadata = {
            "pdf_url": entry.pdf_url,
            "updated": entry.updated.strftime('%Y-%m-%d %H:%M:%S') if isinstance(entry.updated, datetime) else entry.updated,
            "published": entry.published.strftime('%Y-%m-%d %H:%M:%S') if isinstance(entry.published, datetime) else entry.published,
            "authors": [author.name for author in entry.authors],
            "comment": entry.comment,
            "journal_ref": entry.journal_ref,
            "doi": entry.doi,
            "primary_category": entry.primary_category,
            "links": {link.title: link.href for link in entry.links},
        }
        # Create EntityReference
        entity = EntityReference(
            source_id=f'arxiv:{entry.entry_id}',
            name=entry.title,
            description=entry.summary if entry.summary else None,
            url=entry.entry_id,
            categories=categories,
            source=ApiType.ARXIV_SEARCH,
            metadata=metadata,
        )
        return entity