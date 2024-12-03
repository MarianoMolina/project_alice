# APITask

A specialized task implementation for straightforward API interactions. Unlike other task types, APITask simplifies the node structure to a single 'default' node while providing robust API validation and error handling.

## Key Features
- Single node, focused execution pattern
- Automatic API validation and configuration
- Built-in retry handling
- Direct mapping to API engines

## Usage
```python
class SearchAPITask(APITask):
    required_apis = [ApiType.GOOGLE_SEARCH]
    api_engine = GoogleSearchEngine
    input_variables = FunctionParameters(
        properties={
            "query": ParameterDefinition(
                type="string",
                description="Search query"
            )
        },
        required=["query"]
    )
```

## Supported API Types

API Tasks support various non-model API types:
```typescript
enum ApiType {
    WIKIPEDIA_SEARCH = 'wikipedia_search',
    GOOGLE_SEARCH = 'google_search',
    EXA_SEARCH = 'exa_search',
    ARXIV_SEARCH = 'arxiv_search',
    REDDIT_SEARCH = 'reddit_search',
    GOOGLE_KNOWLEDGE_GRAPH = 'google_knowledge_graph',
    WOLFRAM_ALPHA = 'wolfram_alpha'
}
```

## Creating API Tasks

### Basic Structure

```typescript
const searchTask = new APITask({
    task_name: "google_search",
    task_description: "Perform a Google search query",
    required_apis: [ApiType.GOOGLE_SEARCH],
    input_variables: {
        type: "object",
        properties: {
            "query": {
                type: "string",
                description: "Search query to execute"
            },
            "num_results": {
                type: "integer",
                description: "Number of results to return",
                default: 5
            }
        },
        required: ["query"]
    }
});
```

### API-Specific Configuration

#### Google Search Task
```typescript
const googleSearchTask = new APITask({
    task_name: "enhanced_search",
    task_description: "Enhanced Google search with filters",
    required_apis: [ApiType.GOOGLE_SEARCH],
    input_variables: {
        type: "object",
        properties: {
            "query": {
                type: "string",
                description: "Search query"
            },
            "site": {
                type: "string",
                description: "Limit search to specific site",
                default: null
            },
            "date_range": {
                type: "string",
                description: "Date range for results",
                default: null
            }
        },
        required: ["query"]
    }
});
```

#### ArXiv Search Task
```typescript
const arxivSearchTask = new APITask({
    task_name: "arxiv_search",
    task_description: "Search academic papers on arXiv",
    required_apis: [ApiType.ARXIV_SEARCH],
    input_variables: {
        type: "object",
        properties: {
            "query": {
                type: "string",
                description: "Search query"
            },
            "max_results": {
                type: "integer",
                description: "Maximum number of results",
                default: 10
            },
            "sort_by": {
                type: "string",
                description: "Sort order (relevance, lastUpdatedDate, submittedDate)",
                default: "relevance"
            }
        },
        required: ["query"]
    }
});
```

## API Engines

Each API type has a corresponding engine class that handles the actual API interaction:

### Engine Mapping
```typescript
const api_engine_map = {
    ApiType.WIKIPEDIA_SEARCH: WikipediaSearchAPI,
    ApiType.GOOGLE_SEARCH: GoogleSearchAPI,
    ApiType.EXA_SEARCH: ExaSearchAPI,
    ApiType.ARXIV_SEARCH: ArxivSearchAPI,
    ApiType.REDDIT_SEARCH: RedditSearchAPI,
    ApiType.GOOGLE_KNOWLEDGE_GRAPH: GoogleGraphEngine,
    ApiType.WOLFRAM_ALPHA: WolframAlphaEngine
};
```

### Engine Implementation

Each engine implements:
1. Input validation
2. API call handling
3. Response formatting
4. Error handling

## Execution Flow

1. **Validation**
   - Verify API configuration
   - Validate input parameters
   - Check API health status

2. **Execution**
   - Make API call
   - Handle response/errors
   - Format results

3. **Response Generation**
   - Create standardized response
   - Include relevant metadata
   - Handle retries if needed
