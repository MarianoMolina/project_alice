# Retrieval Task

The Retrieval Task handles semantic search over embedded content, enabling the discovery of relevant information based on semantic similarity. It combines embedding generation with sophisticated matching logic to find the most relevant content.

## Structure

```python
class RetrievalTask(AliceTask):
    agent: AliceAgent
    input_variables: FunctionParameters
    required_apis: List[ApiType] = [ApiType.EMBEDDINGS]
    start_node: str = 'ensure_embeddings_in_data_cluster'
```

### Input Parameters
```python
{
    "prompt": {
        "type": "string",
        "description": "The input prompt text to retrieve embeddings for"
    },
    "max_results": {
        "type": "integer",
        "description": "Maximum number of results to return",
        "default": 10
    },
    "similarity_threshold": {
        "type": "number",
        "description": "Similarity threshold for matches",
        "default": 0.6
    }
}
```

### Node Structure
Two-node workflow for preprocessing and retrieval:
```python
node_end_code_routing = {
    'ensure_embeddings_in_data_cluster': {
        0: ('retrieve_relevant_embeddings', False),
        1: ('ensure_embeddings_in_data_cluster', True),
    },
    'retrieve_relevant_embeddings': {
        0: (None, False),
        1: ('retrieve_relevant_embeddings', True),
    }
}
```

## Key Features

### 1. Automatic Embedding Generation
Ensures all searchable content has embeddings:
```python
async def ensure_embeddings_for_data_cluster(
    self,
    data_cluster: References,
    api_manager: APIManager
) -> References:
    # Process each field excluding strings and existing embeddings
    updated_data_cluster = References()
    fields_to_process = [
        field for field in data_cluster.model_fields_set
        if field not in ['embeddings']
    ]
```

### 2. Language-Aware Processing
Handles different content types with appropriate language models:
```python
def map_extension_to_language(self, extension: str) -> Language:
    extension_to_language = {
        'py': Language.PYTHON,
        'js': Language.JS,
        'java': Language.JAVA,
        # ... other mappings
    }
    return extension_to_language.get(extension, Language.TEXT)
```

### 3. Similarity Search
Implements cosine similarity-based search:
```python
def retrieve_top_embeddings(
    self,
    prompt_embedding: List[float],
    data_cluster: References,
    similarity_threshold: float,
    max_results: int
) -> List[Dict[str, Any]]
```

## Usage Examples

### Basic Retrieval
```python
task = RetrievalTask(
    agent=some_agent,
    task_name="semantic_search",
    task_description="Find relevant content"
)

response = await task.run(
    api_manager=api_manager,
    data_cluster=data_cluster,
    prompt="Search query",
    max_results=5,
    similarity_threshold=0.7
)
```

### Processing Results
```python
if response.status == "complete":
    references = response.node_references[-1].references
    
    # Access different types of matches
    if references.messages:
        print("Matching messages:", len(references.messages))
    if references.files:
        print("Matching files:", len(references.files))
```

## Best Practices

1. **Data Cluster Organization**
   - Group related content
   - Maintain consistent embedding updates
   - Use appropriate thresholds

2. **Performance Optimization**
   - Cache frequently accessed embeddings
   - Use appropriate batch sizes
   - Monitor similarity thresholds

3. **Content Processing**
   ```python
   def get_item_content(self, item: BaseModel) -> Union[str, List[str]]:
       if isinstance(item, FileReference):
           return item.transcript.content
       elif hasattr(item, 'content'):
           return item.content
       raise ValueError(f"Cannot extract content from item: {item}")
   ```

4. **Error Handling**
   ```python
   try:
       updated_data_cluster = await self.ensure_embeddings_for_data_cluster(
           data_cluster, api_manager
       )
   except Exception as e:
       return NodeResponse(
           exit_code=1,
           references=References(messages=[
               MessageDict(
                   role="system",
                   content=f"Failed to ensure embeddings: {str(e)}"
               )
           ])
       )
   ```