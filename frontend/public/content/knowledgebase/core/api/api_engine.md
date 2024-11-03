# API Engines

API Engines are the core components that handle interactions with external services in the Alice system. They provide a standardized way to make API calls and process responses, ensuring consistent behavior across different types of APIs.

## Core Concepts

### Base API Engine

The base `APIEngine` class defines the fundamental structure for all API engines:

```python
class APIEngine(BaseModel):
    input_variables: FunctionParameters
    required_api: ApiType

    async def generate_api_response(self, api_data: Dict[str, Any], **kwargs) -> References:
        pass
```

Key components:
- `input_variables`: Defines the expected input parameters
- `required_api`: Specifies which API type this engine handles
- `generate_api_response`: Abstract method that all engines must implement

## Types of API Engines

API Engines fall into two main categories:

### 1. Model API Engines

These engines interact with AI model providers. Example: LLMEngine

```python
class LLMEngine(APIEngine):
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "messages": ParameterDefinition(
                    type="array",
                    description="The list of messages in the conversation."
                ),
                "tools": ParameterDefinition(
                    type="array",
                    description="Available tools for the model"
                )
                # ... other parameters
            },
            required=["messages"]
        )
    )
    required_api: ApiType = Field(ApiType.LLM_MODEL)
```

Features:
- Handle model-specific parameters (temperature, max_tokens, etc.)
- Process token usage and costs
- Support for various model providers (OpenAI, Azure, etc.)
- Handle tool/function calling capabilities

### 2. Service API Engines

These engines interact with non-model services. Example: WolframAlphaEngine

```python
class WolframAlphaEngine(APIEngine):
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "query": ParameterDefinition(
                    type="string",
                    description="Query string for Wolfram Alpha"
                ),
                "units": ParameterDefinition(
                    type="string",
                    description="Unit system (metric/imperial)",
                    default="metric"
                )
            },
            required=["query"]
        )
    )
    required_api: ApiType = Field(ApiType.WOLFRAM_ALPHA)
```

Features:
- Simpler parameter structure
- Focus on specific service capabilities
- Handle service-specific authentication
- Process specialized response formats

## Creating Custom API Engines

### 1. Basic Structure

```python
class CustomEngine(APIEngine):
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "main_input": ParameterDefinition(
                    type="string",
                    description="Primary input for the API"
                ),
                # Additional parameters
            },
            required=["main_input"]
        )
    )
    required_api: ApiType = Field(ApiType.CUSTOM_API)

    async def generate_api_response(
        self, 
        api_data: Dict[str, Any], 
        **kwargs
    ) -> References:
        # Implementation
        pass
```

### 2. Response Handling

Always return a `References` object containing standardized message formats:

```python
msg = MessageDict(
    role="assistant",
    content=result,
    generated_by="tool",
    type=ContentType.TEXT,
    creation_metadata={
        "source": "Your API Name",
        "parameters": input_params,
    }
)
return References(messages=[msg])
```

### 3. Error Handling

Implement comprehensive error handling:

```python
async def generate_api_response(self, api_data: Dict[str, Any], **kwargs):
    try:
        # Validate API configuration
        if not api_data.get('required_key'):
            raise ValueError("Missing required API configuration")

        # Make API call
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                if response.status != 200:
                    return self._create_error_response(
                        await response.text()
                    )
                data = await response.json()
                
        # Process response
        return self._create_success_response(data)
        
    except Exception as e:
        LOGGER.error(f"API call failed: {str(e)}")
        raise
```

## Best Practices

1. **Input Validation**
   - Define clear input_variables with proper types
   - Validate all required parameters
   - Provide meaningful defaults when appropriate

2. **Error Handling**
   - Catch and log all exceptions
   - Return meaningful error messages
   - Handle API-specific error codes

3. **Response Processing**
   - Convert API responses to standardized formats
   - Include relevant metadata
   - Handle rate limits and retries

4. **Authentication**
   - Securely handle API keys and tokens
   - Support multiple authentication methods if needed
   - Validate authentication before making calls

5. **Performance**
   - Use async/await for all I/O operations
   - Implement proper timeout handling
   - Cache responses when appropriate

## Examples

### Basic Search Engine
```python
class SearchEngine(APIEngine):
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "query": ParameterDefinition(
                    type="string",
                    description="Search query"
                ),
                "limit": ParameterDefinition(
                    type="integer",
                    description="Number of results",
                    default=10
                )
            },
            required=["query"]
        )
    )
    required_api: ApiType = Field(ApiType.SEARCH_API)

    async def generate_api_response(
        self, 
        api_data: Dict[str, Any],
        query: str,
        limit: int = 10,
        **kwargs
    ) -> References:
        endpoint = api_data['endpoint']
        api_key = api_data['api_key']
        
        async with aiohttp.ClientSession() as session:
            async with session.get(
                endpoint,
                params={'q': query, 'limit': limit},
                headers={'Authorization': f'Bearer {api_key}'}
            ) as response:
                data = await response.json()
                
                return References(messages=[
                    MessageDict(
                        role="assistant",
                        content=data['results'],
                        generated_by="tool",
                        type=ContentType.TEXT,
                        creation_metadata={
                            "source": "Search API",
                            "query": query,
                            "limit": limit
                        }
                    )
                ])
```

### File Processing Engine
```python
class FileProcessingEngine(APIEngine):
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "file_content": ParameterDefinition(
                    type="string",
                    description="Content to process"
                ),
                "format": ParameterDefinition(
                    type="string",
                    description="Output format",
                    default="json"
                )
            },
            required=["file_content"]
        )
    )
    required_api: ApiType = Field(ApiType.FILE_PROCESSOR)

    async def generate_api_response(
        self,
        api_data: Dict[str, Any],
        file_content: str,
        format: str = "json",
        **kwargs
    ) -> References:
        # Process file content
        # Return standardized response
        pass
```