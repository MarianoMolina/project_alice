# API System Architecture

The API system provides a flexible framework for managing different types of API interactions and their implementations. It separates the concept of what an API does (ApiType) from how it's implemented (ApiName), allowing for consistent interfaces with diverse implementations.

## Core Components

### 1. API Types
ApiType defines distinct capabilities or actions, regardless of implementation:
```python
class ApiType(str, Enum):
    LLM_MODEL = 'llm_api'
    IMG_VISION = 'img_vision'
    IMG_GENERATION = 'img_generation'
    SPEECH_TO_TEXT = 'speech_to_text'
    TEXT_TO_SPEECH = 'text_to_speech'
    EMBEDDINGS = 'embeddings'
    GOOGLE_SEARCH = 'google_search'
    WIKIPEDIA_SEARCH = 'wikipedia_search'
    # ... etc
```

### 2. API Names
ApiName represents specific implementations or providers:
```python
class ApiName(str, Enum):
    OPENAI = 'openai'
    ANTHROPIC = 'anthropic'
    GEMINI = 'gemini'
    GOOGLE_SEARCH = 'google_search'
    WIKIPEDIA = 'wikipedia'
    # ... etc
```

### 3. API Configuration
APIConfig manages the credentials and settings for each implementation:
```python
config = APIConfig(
    name="openai-config",
    api_name=ApiName.OPENAI,
    data={
        "api_key": "key",
        "base_url": "https://api.openai.com/v1"
    }
)
```

## Relationships

1. **Type-to-Name Mapping**
   - One ApiType can have multiple ApiName implementations
   - Some ApiTypes may have only one implementation (for now)
   ```python
   ApiEngineMap = {
       ApiType.LLM_MODEL: {
           ApiName.OPENAI: LLMEngine,
           ApiName.ANTHROPIC: LLMAnthropic,
           ApiName.GEMINI: GeminiLLMEngine
       },
       ApiType.WIKIPEDIA_SEARCH: {
           ApiName.WIKIPEDIA: WikipediaSearchAPI  # Single implementation
       }
   }
   ```

2. **Configuration Requirements**
   - Each ApiName has specific configuration requirements
   - Defined in API_CONFIG_TYPES mapping
   ```python
   API_CONFIG_TYPES = {
       ApiName.OPENAI: BaseApiConfig,
       ApiName.WIKIPEDIA: NoConfig,  # No credentials needed
       ApiName.GOOGLE_SEARCH: GoogleSearchConfig  # Custom config
   }
   ```

## Extending the System

### Adding a New API Type

When to add a new ApiType:
- The API serves a distinct purpose
- It requires a unique interface
- It handles different kinds of data

Example:
```python
# 1. Add new type
class ApiType(str, Enum):
    DETAILED_SEARCH = 'detailed_search'

# 2. Create interface
class DetailedSearchEngine(APIEngine):
    input_variables = FunctionParameters(
        properties={
            "query": ParameterDefinition(type="string"),
            "depth": ParameterDefinition(type="integer")
        }
    )
    required_api = ApiType.DETAILED_SEARCH

# 3. Update mapping
ApiEngineMap[ApiType.DETAILED_SEARCH] = {
    ApiName.GOOGLE_SEARCH: GoogleDetailedSearch
}
```

### Adding a New API Name

When to add a new ApiName:
- New provider for existing capability
- Different implementation approach
- Unique configuration requirements

Example:
```python
# 1. Add new provider
class ApiName(str, Enum):
    GOOGLE_SEARCH_ENTERPRISE = 'google_search_enterprise'

# 2. Add configuration requirements
API_CONFIG_TYPES[ApiName.GOOGLE_SEARCH_ENTERPRISE] = EnterpriseConfig

# 3. Create implementation
class GoogleEnterpriseSearch(DetailedSearchEngine):
    async def generate_api_response(self, api_data, **kwargs):
        # Implementation using enterprise API
        pass

# 4. Update mapping
ApiEngineMap[ApiType.DETAILED_SEARCH][ApiName.GOOGLE_SEARCH_ENTERPRISE] = GoogleEnterpriseSearch
```

## Best Practices

1. **API Type Definition**
   - Keep types focused on distinct capabilities
   - Consider interface requirements
   - Plan for multiple implementations

2. **API Name Addition**
   - Ensure consistent behavior with type
   - Define clear configuration requirements
   - Document provider-specific features

3. **Configuration Management**
   - Use appropriate configuration types
   - Validate required credentials
   - Handle provider-specific settings

## Common Patterns

1. **Single Implementation API Types**
```python
# Perfectly valid to start with one implementation
ApiEngineMap[ApiType.NEW_TYPE] = {
    ApiName.SINGLE_PROVIDER: SingleImplementation
}
```

2. **Multiple Implementations**
```python
# Same interface, different approaches
ApiEngineMap[ApiType.SEARCH] = {
    ApiName.BASIC: BasicSearch,      # Quick, simple results
    ApiName.DETAILED: DetailedSearch # In-depth analysis
}
```

3. **Shared Configurations**
```python
# Reuse configuration types where appropriate
API_CONFIG_TYPES.update({
    ApiName.PROVIDER_A: BaseApiConfig,
    ApiName.PROVIDER_B: BaseApiConfig
})
```

## Troubleshooting

1. **Configuration Issues**
   - Verify API_CONFIG_TYPES mapping
   - Check required fields
   - Validate credential format

2. **Implementation Conflicts**
   - Ensure consistent interface usage
   - Verify response formats
   - Check configuration compatibility

3. **Type/Name Confusion**
   - Review type purpose
   - Check implementation requirements
   - Verify mapping relationships

## Relationship with Agents

In the Alice system, [Agents](../agent) can be configured to use specific APIs for different model types. This is achieved through the `models` property in the `AliceAgent` interface:

```typescript
export interface AliceAgent {
    // ... other properties
    models?: { [key in ModelType]?: AliceModel };
}
```

This structure allows an agent to use different models (and thus, different APIs) for various tasks:
- A CHAT model for text generation
- A VISION model for image understanding
- An EMBEDDINGS model for text embeddings
- And so on...