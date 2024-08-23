import aiohttp
from bs4 import BeautifulSoup
from typing import Dict, Any, List
from pydantic import BaseModel, Field
from workflow_logic.util import SearchOutput, SearchResult
from workflow_logic.core.api.engines.api_engine import APIEngine
from workflow_logic.core.parameters import FunctionParameters, ParameterDefinition

class BeautifulSoupWebScraperEngine(APIEngine):
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "url": ParameterDefinition(
                    type="string",
                    description="The URL of the webpage to scrape."
                ),
                "selector": ParameterDefinition(
                    type="string",
                    description="CSS selector to target specific elements."
                ),
                "max_results": ParameterDefinition(
                    type="integer",
                    description="Maximum number of results to return.",
                    default=10
                )
            },
            required=["url", "selector"]
        )
    )

    async def generate_api_response(self, api_data: Dict[str, Any], url: str, selector: str, max_results: int = 10) -> SearchOutput:
        """
        Scrapes content from a webpage using BeautifulSoup.

        Args:
            api_data (Dict[str, Any]): Configuration data for the API (e.g., user agent).
            url (str): The URL of the webpage to scrape.
            selector (str): CSS selector to target specific elements.
            max_results (int): Maximum number of results to return.

        Returns:
            SearchOutput: Scraped content wrapped in a SearchOutput object.
        """
        headers = {
            "User-Agent": api_data.get("user_agent", "Alice Web Scraper 1.0")
        }

        async with aiohttp.ClientSession(headers=headers) as session:
            async with session.get(url) as response:
                if response.status != 200:
                    raise Exception(f"Failed to fetch the webpage: HTTP {response.status}")
                
                html_content = await response.text()

        soup = BeautifulSoup(html_content, 'html.parser')
        elements = soup.select(selector)[:max_results]

        results = []
        
        # This probably needs a new data structure that enables chunking, etc. 
        for element in elements:
            result = SearchResult(
                title=element.get_text(strip=True)[:100],  # First 100 characters as title
                url=url,
                content=element.get_text(strip=True),
                metadata={
                    "html": str(element),
                    "attributes": element.attrs
                }
            )
            results.append(result)

        return SearchOutput(content=results)