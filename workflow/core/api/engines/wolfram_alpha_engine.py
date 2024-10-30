import aiohttp, urllib.parse, logging
from pydantic import Field
from typing import Dict, Any, Optional
from workflow.core.api.engines import APIEngine
from workflow.core.data_structures import (
    References,
    FunctionParameters,
    ParameterDefinition,
    ApiType,
)
from workflow.core.data_structures.message import MessageDict, ContentType

LOGGER = logging.getLogger(__name__)

class WolframAlphaEngine(APIEngine):
    """
    WolframAlphaEngine for querying the Wolfram Alpha Full Results API.

    This engine accepts a 'query' string and returns the computed results from Wolfram Alpha.
    """

    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "query": ParameterDefinition(
                    type="string",
                    description="The query string to be sent to Wolfram Alpha.",
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
            },
            required=["query"],
        ),
        description="Inputs: 'query' string for the search, optional 'units', and optional 'format'.",
    )

    required_api: ApiType = Field(ApiType.WEB_SEARCH, title="The API engine required")

    async def generate_api_response(
        self,
        api_data: Dict[str, Any],
        query: str,
        units: Optional[str] = "metric",
        format: Optional[str] = "plaintext",
        **kwargs,
    ) -> References:
        """
        Generates the API response using the Wolfram Alpha Full Results API.

        Args:
            api_data (Dict[str, Any]): Configuration data for the API (e.g., API key).
            query (str): The query string to be sent to Wolfram Alpha.
            units (Optional[str]): Unit system to use. 'metric' or 'imperial'. Default is 'metric'.
            format (Optional[str]): Output format. 'plaintext', 'image', 'html', 'json'. Default is 'plaintext'.
            **kwargs: Additional keyword arguments.

        Returns:
            References: A References object containing the response message.
        """
        app_id = api_data.get('app_id')
        if not app_id:
            raise ValueError("App ID not found in API data")

        # Validate 'units'
        if units not in ["metric", "imperial"]:
            raise ValueError("Units must be 'metric' or 'imperial'")

        # Validate 'format'
        valid_formats = ["plaintext", "image", "html", "json"]
        if format not in valid_formats:
            raise ValueError(f"Format must be one of {valid_formats}")

        # Prepare the API request parameters
        params = {
            'appid': app_id,
            'input': query,
            'units': units,
            'format': format,
            'output': 'JSON',  # Requesting JSON output for easier parsing
        }

        # Build the URL with encoded parameters
        service_url = 'https://api.wolframalpha.com/v2/query'
        url = service_url + '?' + urllib.parse.urlencode(params)

        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(url) as resp:
                    if resp.status != 200:
                        error_text = await resp.text()
                        LOGGER.error(f"Error from API: {resp.status} {error_text}")
                        raise Exception(f"API request failed with status {resp.status}")
                    response_data = await resp.json()

                    # Check if the query was successful
                    if not response_data.get('queryresult', {}).get('success', False):
                        error_msg = response_data.get('queryresult', {}).get('error', {}).get('msg', 'Unknown error')
                        LOGGER.error(f"Wolfram Alpha query failed: {error_msg}")
                        raise Exception(f"Wolfram Alpha query failed: {error_msg}")

                    # Extract relevant information from the response
                    pods = response_data['queryresult'].get('pods', [])
                    result_texts = []

                    for pod in pods:
                        title = pod.get('title', '')
                        subpods = pod.get('subpods', [])
                        for subpod in subpods:
                            plaintext = subpod.get('plaintext', '')
                            if plaintext:
                                result_texts.append(f"{title}:\n{plaintext}")

                    content = "\n\n".join(result_texts)

                    # Create a MessageDict with the content
                    msg = MessageDict(
                        role="assistant",
                        content=content,
                        generated_by="wolfram_alpha",
                        type=ContentType.TEXT,
                        creation_metadata={
                            "source": "Wolfram Alpha",
                        },
                    )

                    return References(messages=[msg])

            except Exception as e:
                LOGGER.error(f"Error fetching data for query '{query}': {e}")
                raise
