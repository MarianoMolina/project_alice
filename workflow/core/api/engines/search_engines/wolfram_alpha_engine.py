import aiohttp, urllib.parse, logging
from pydantic import Field
from typing import Dict, Any, Optional
from workflow.core.api.engines.search_engines.search_engine import APISearchEngine
from workflow.core.data_structures import (
    References,
    FunctionParameters,
    ParameterDefinition, MessageGenerators, RoleTypes,
    MessageDict, ContentType,
    ApiType,
)
from workflow.util import LOGGER

class WolframAlphaEngine(APISearchEngine):
    """
    WolframAlphaEngine for querying the Wolfram Alpha Full Results API.

    This engine accepts a 'query' string and returns the computed results from Wolfram Alpha.
    """
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "prompt": ParameterDefinition(
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
            required=["prompt"],
        ),
        description="Inputs: 'prompt' string for the search, optional 'units', and optional 'format'.",
    )
    required_api: ApiType = Field(ApiType.WOLFRAM_ALPHA, title="The API engine required")

    async def generate_api_response(
        self,
        api_data: Dict[str, Any],
        prompt: str,
        units: Optional[str] = "metric",
        format: Optional[str] = "plaintext",
        **kwargs,
    ) -> References:
        """
        Generates the API response using the Wolfram Alpha Full Results API.

        Args:
            api_data (Dict[str, Any]): Configuration data for the API (e.g., API key).
            prompt (str): The prompt string to be sent to Wolfram Alpha.
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

        prompt_params = {
            'input': prompt,
            'units': units,
            'format': format,

        }
        # Prepare the API request parameters
        params = {
            'appid': app_id,
            'input': prompt,
            'units': units,
            'format': format,
        }

        # Build the URL with encoded parameters
        service_url = 'https://api.wolframalpha.com/v1/llm-api'
        url = service_url + '?' + urllib.parse.urlencode(params)

        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(url) as resp:
                    if resp.status != 200:
                        error_text = await resp.text() # Generate a message with this text and return that
                        msg = MessageDict(
                            role=RoleTypes.ASSISTANT,
                            content=error_text,
                            generated_by=MessageGenerators.TOOL,
                            type=ContentType.TEXT,
                            creation_metadata={
                                "source": "Wolfram Alpha - Error Message",
                                "parameters": prompt_params,
                            },
                        )
                        LOGGER.error(f"Error from API: {resp.status} {error_text}")
                        return References(messages=[msg])
                    LOGGER.debug(f"Response status: {await resp.read()}")
                    response_data = await resp.read()

                    LOGGER.debug(f"Response data: {response_data}")
                    # Create a MessageDict with the content
                    msg = MessageDict(
                        role=RoleTypes.ASSISTANT,
                        content=response_data,
                        generated_by=MessageGenerators.TOOL,
                        type=ContentType.TEXT,
                        creation_metadata={
                            "source": "Wolfram Alpha",
                            "parameters": prompt_params,
                        },
                    )

                    return References(messages=[msg])

            except Exception as e:
                LOGGER.error(f"Error fetching data for prompt '{prompt}': {e}")
                raise
