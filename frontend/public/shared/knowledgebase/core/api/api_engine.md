# API Engines

APIEngine provides a flexible interface system for implementing API interactions within the workflow. It serves as a bridge between raw API calls and the workflow's standardized data structures, ensuring consistent behavior across different providers and API types.

## Core Structure

1. **Base Interface Definition**
   - Each APIEngine subclass defines its interface through `input_variables`
   - Standardized response format using `References` objects
   - Type-specific API requirements through `required_api`

```python
class CustomAPIEngine(APIEngine):
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "my_input": ParameterDefinition(
                    type="string",
                    description="Custom input parameter"
                )
            },
            required=["my_input"]
        )
    )
    required_api: ApiType = Field(ApiType.CUSTOM_API)
```

2. **Response Standardization**
   - All API responses are wrapped in `References` objects
   - Supports various content types (messages, files, embeddings)
   - Maintains consistent metadata structure

3. **Provider Independence**
   - Single interface can support multiple providers
   - Provider-specific logic contained in implementation classes
   - Common utilities shared across implementations

## Key Features

### Interface Extension
APIEngine classes can be extended without breaking existing implementations:
- Add new parameters to parent class for all implementations
- Override parameters in specific implementations
- Add provider-specific methods while maintaining interface

```python
# Adding new parameter to parent
class SearchAPIEngine(APIEngine):
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            properties={
                "max_results": ParameterDefinition(
                    type="integer",
                    default=10
                )
            }
        )
    )

# Provider-specific implementation
class GoogleSearchEngine(SearchAPIEngine):
    async def generate_api_response(self, api_data: Dict, **kwargs):
        # Implementation specific to Google
        pass
```

### Provider Mapping
Each APIType can map to multiple provider implementations:
- Same interface, different providers
- Consistent behavior across implementations
- Easy addition of new providers

```python
ApiEngineMap = {
    ApiType.LLM_MODEL: {
        ApiName.OPENAI: LLMEngine,
        ApiName.ANTHROPIC: LLMAnthropic,
        ApiName.GEMINI: GeminiLLMEngine
    }
}
```

### Response Handling
All engines use standardized response structures:
- `References` objects for output consistency
- Standardized metadata and error handling
- Support for multiple content types

## Best Practices

1. **Interface Design**
   - Keep base interfaces minimal and focused
   - Add optional parameters for flexibility
   - Document parameter requirements clearly

2. **Implementation Pattern**
   - Inherit from appropriate base engine
   - Override only necessary methods
   - Maintain consistent error handling
   - Include comprehensive metadata

3. **Response Formatting**
   - Always wrap responses in `References`
   - Include appropriate metadata
   - Handle errors consistently
   - Validate output format

```python
async def generate_api_response(self, api_data: ModelConfig, **kwargs) -> References:
    try:
        # API-specific implementation
        result = await self.make_api_call(api_data, **kwargs)
        return References(
            messages=[MessageDict(
                content=result,
                metadata=self.get_metadata()
            )]
        )
    except Exception as e:
        # Standardized error handling
        raise APIEngineError(f"API call failed: {str(e)}")
```

## Common Issues and Solutions

1. **Parameter Inheritance**
   - Issue: Base class parameters not recognized
   - Solution: Ensure proper Field inheritance and type hints

2. **Response Formatting**
   - Issue: Inconsistent response structures
   - Solution: Use helper methods for response creation

3. **Provider Compatibility**
   - Issue: Provider-specific features breaking interface
   - Solution: Use optional parameters and careful defaults

4. **Error Handling**
   - Issue: Inconsistent error formats
   - Solution: Use standardized error handling methods

## Working with Multiple Providers

When implementing multiple providers for the same API type:

1. **Common Interface**
   ```python
   class LLMEngine(APIEngine):
       # Base interface all LLM providers will use
       input_variables = FunctionParameters(...)
   ```

2. **Provider-Specific Implementation**
   ```python
   class LLMAnthropic(LLMEngine):
       # Anthropic-specific adaptations while maintaining interface
       def adapt_messages(self, messages):
           # Convert to Anthropic format
           pass
   ```

3. **Consistent Response Format**
   ```python
   # Both implementations return same format
   return References(
       messages=[MessageDict(
           content=response_content,
           metadata=provider_specific_metadata
       )]
   )
   ```