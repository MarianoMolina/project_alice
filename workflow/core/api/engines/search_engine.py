from pydantic import Field
from workflow.core.data_structures import (
    FunctionParameters, ParameterDefinition
    )
from workflow.core.api.engines.api_engine import APIEngine

class APISearchEngine(APIEngine):
    """
    Base class for search-based API engines.

    This class extends APIEngine to provide a common structure for search APIs.
    It defines a standard set of input parameters suitable for most search operations.

    Attributes:
        input_variables (FunctionParameters): Defines the input structure for search operations,
                                              including 'prompt' and 'max_results'.
    """
    input_variables: FunctionParameters = Field(FunctionParameters(
    type="object",
    properties={
        "prompt": ParameterDefinition(
            type="string",
            description="The search query.",
            default=None
        ),
        "max_results": ParameterDefinition(
            type="integer",
            description="Maximum number of results to return.",
            default=10
        )
    },
    required=["prompt"]
), description="This inputs this API engine takes: requires a prompt input, and optional inputs such as max_results. Default is 10.")
    