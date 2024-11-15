# Embeddings

The Alice system implements a comprehensive embedding system that enables semantic search and similarity analysis through vector representations of content. This is achieved through a combination of core data structures, specialized tasks, and a dedicated API engine.

## Core Components

### 1. EmbeddingChunk
```python
class EmbeddingChunk(BaseDataStructure):
    vector: List[float]         # Vector representation
    text_content: str          # Original text
    index: int                 # Position in sequence
    creation_metadata: dict    # Creation information
```

### 2. Embeddable Interface
```python
class Embeddable(BaseDataStructure):
    embedding: Optional[List[EmbeddingChunk]]
```
All reference types (except strings) implement this interface, enabling embedding storage:
- MessageDict
- FileReference
- TaskResponse
- EntityReference
- UserInteraction
- Tool Calls
- Code Executions

## Task Components

### 1. Embedding Generation (EmbeddingTask)
Basic task for generating embeddings:
```python
async def execute_generate_embedding(
    self,
    execution_history: List[NodeResponse],
    node_responses: List[NodeResponse],
    **kwargs
) -> NodeResponse:
    embedding_chunks = await self.agent.generate_embeddings(
        api_manager=api_manager,
        input=input_text,
        language=Language.TEXT
    )
    return NodeResponse(
        exit_code=0,
        references=References(embeddings=embedding_chunks)
    )
```

### 2. Semantic Retrieval (RetrievalTask)
Task for finding semantically similar content:
```python
async def execute_retrieve_relevant_embeddings(
    self,
    execution_history: List[NodeResponse],
    node_responses: List[NodeResponse],
    **kwargs
) -> NodeResponse:
    # Generate embedding for search query
    prompt_embedding = await self.agent.generate_embeddings(...)
    
    # Find similar content
    matches = self.retrieve_top_embeddings(
        prompt_embedding,
        data_cluster,
        similarity_threshold,
        max_results
    )
    
    return NodeResponse(
        exit_code=0,
        references=self.prepare_result_references(matches)
    )
```

## API Engine

The EmbeddingEngine handles the actual generation of embeddings:

```python
class EmbeddingEngine(APIEngine):
    async def generate_api_response(
        self,
        api_data: ModelConfig,
        input: str,
        language: str = "text"
    ) -> References:
        # 1. Handle language-specific chunking
        chunks = await self.semantic_text_chunking(input, api_data)
        
        # 2. Generate embeddings for chunks
        embedding_chunks = await self.generate_embedding(chunks, api_data)
        
        return References(embeddings=embedding_chunks)
```

Key features:
- Language-aware text chunking
- Semantic chunking for natural language
- Token limit management
- Configurable chunk sizing

## Usage Patterns

### 1. Direct Embedding Generation
```python
# Create embedding task
embedding_task = EmbeddingTask(
    agent=agent,
    task_name="generate_embeddings"
)

# Generate embeddings
result = await embedding_task.run(
    api_manager=api_manager,
    input="Text to embed"
)

embeddings = result.node_references[-1].references.embeddings
```

### 2. Semantic Search
```python
# Create retrieval task
retrieval_task = RetrievalTask(
    agent=agent,
    task_name="semantic_search"
)

# Search for content
result = await retrieval_task.run(
    api_manager=api_manager,
    data_cluster=data_cluster,
    prompt="Search query",
    max_results=5,
    similarity_threshold=0.7
)

matches = result.node_references[-1].references
```

### 3. Auto-Embedding Content
```python
# Content automatically gets embeddings when added to data cluster
message = MessageDict(
    content="Some content",
    type=ContentType.TEXT
)
data_cluster = References(messages=[message])

# Ensure embeddings
updated_cluster = await retrieval_task.ensure_embeddings_for_data_cluster(
    data_cluster,
    api_manager
)
```

## Text Chunking

### 1. Language-Specific Chunking
The system uses different strategies based on content type:

```python
class RecursiveTextSplitter:
    def get_separators_for_language(language: Language) -> List[str]:
        if language == Language.PYTHON:
            return [
                "\nclass ",
                "\ndef ",
                "\n\tdef ",
                "\n\n",
                "\n",
                " "
            ]
        elif language == Language.JS:
            return [
                "\nfunction ",
                "\nclass ",
                "\nconst ",
                "\nlet ",
                # ...
            ]
        # ... other languages
```

### 2. Semantic Chunking
For natural language text:
```python
async def semantic_text_chunking(
    self,
    input_text: str,
    api_data: ModelConfig
) -> List[str]:
    # Handle small texts
    if est_token_count(input_text) < 600:
        return [input_text]
        
    # Split into semantic chunks
    sentences = self.setup_initial_sentences(input_text)
    combined = self.create_combined_sentences(sentences)
    embeddings = await self.get_embeddings_for_sentences(
        combined,
        api_data
    )
    
    # Find natural breakpoints
    breakpoints = self.find_breakpoints(
        embeddings,
        combined_sentences
    )
    
    return self.return_final_chunks(breakpoints, sentences)
```

## Best Practices

### 1. Content Management
- Keep chunks semantically meaningful
- Maintain context within chunks
- Use appropriate chunking strategies for different content types

### 2. Performance Optimization
- Cache frequently used embeddings
- Use batch processing for multiple items
- Monitor token usage and chunk sizes

### 3. Search Configuration
- Adjust similarity thresholds based on use case
- Consider result count vs. relevance
- Use appropriate language models for content type

### 4. Error Handling
```python
try:
    embeddings = await self.generate_embedding(chunks, api_data)
except Exception as e:
    LOGGER.error(f"Error in embedding generation: {str(e)}")
    return self.create_error_response(...)
```

## Common Patterns

### 1. Content Preprocessing
```python
def preprocess_content(content: str, language: Language) -> str:
    if language == Language.TEXT:
        # Clean and normalize text
        content = content.strip()
        content = re.sub(r'\s+', ' ', content)
    else:
        # Preserve formatting for code
        content = content.strip()
    return content
```

### 2. Similarity Comparison
```python
def find_similar_content(
    target_embedding: List[float],
    content_embeddings: List[EmbeddingChunk],
    threshold: float = 0.7
) -> List[Tuple[float, EmbeddingChunk]]:
    matches = []
    for chunk in content_embeddings:
        similarity = cosine_similarity(
            target_embedding,
            chunk.vector
        )
        if similarity >= threshold:
            matches.append((similarity, chunk))
    return sorted(matches, key=lambda x: x[0], reverse=True)
```

### 3. Batch Processing
```python
async def process_batch(
    items: List[Embeddable],
    api_manager: APIManager
) -> List[Embeddable]:
    for item in items:
        if not item.embedding:
            content = get_item_content(item)
            embeddings = await generate_embeddings(
                content,
                api_manager
            )
            item.embedding = embeddings
    return items
```