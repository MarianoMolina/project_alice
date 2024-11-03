# Data Clusters

Data Clusters (References) are fundamental containers in the Alice system that organize and manage different types of data references. They provide a structured way to group related information and make it available throughout LLM workflows.

## Structure

```python
class References(BaseModel):
    messages: Optional[List[MessageDict]]
    files: Optional[List[Union[FileReference, FileContentReference]]]
    task_responses: Optional[List[TaskResponse]]
    url_references: Optional[List[URLReference]]
    string_outputs: Optional[List[str]]
    user_interactions: Optional[List[UserInteraction]]
    embeddings: Optional[List[EmbeddingChunk]]
```

## Reference Types

### 1. Messages (MessageDict)
- Chat messages and system communications
- Can contain text, tool calls, and metadata
- Embeddable for semantic search
```python
message_ref = MessageDict(
    role="assistant",
    content="Response content",
    generated_by="llm",
    embedding=[EmbeddingChunk(...)]
)
```

### 2. Files
Two types of file references:
```python
# Stored files
file_ref = FileReference(
    filename="document.txt",
    type=FileType.FILE,
    transcript=MessageDict(...)
)

# Content-only files
content_ref = FileContentReference(
    filename="temp.txt",
    content="File content",
    type=FileType.FILE
)
```

### 3. Task Responses
- Results from task executions
- Can contain nested references
```python
task_ref = TaskResponse(
    task_name="analysis",
    status="complete",
    task_outputs="Analysis results",
    references=References(...)
)
```

### 4. URL References
- External web content references
```python
url_ref = URLReference(
    url="https://example.com",
    title="Example Page",
    content="Page content",
    metadata={"source": "web"}
)
```

### 5. String Outputs
- Simple string storage
- Not embeddable by design
```python
refs = References(
    string_outputs=["Output 1", "Output 2"]
)
```

### 6. User Interactions
- Records of user inputs and choices
```python
interaction_ref = UserInteraction(
    user_checkpoint_id="review_point",
    user_response=UserResponse(...)
)
```

### 7. Embeddings
- Vector representations for semantic search
```python
embedding_ref = EmbeddingChunk(
    vector=[0.1, 0.2, ...],
    text_content="Original text",
    index=0
)
```

## Usage Patterns

### 1. Task Results Organization
```python
# Collecting task outputs
task_results = References(
    task_responses=[task_response],
    messages=[status_message],
    files=[output_file]
)

# Accessing results
if task_results.task_responses:
    latest_response = task_results.task_responses[-1]
```

### 2. Context Building
```python
# Building context for LLM
context = References(
    messages=[system_message, user_message],
    files=[reference_doc],
    url_references=[web_source]
)

# Converting to string representation
context_str = "\n".join([
    msg.content for msg in context.messages
    if msg.content
])
```

### 3. RAG Implementation
```python
# Store documents with embeddings
docs = References(
    files=[
        FileReference(
            filename="doc.txt",
            content="Document content",
            embedding=[EmbeddingChunk(...)]
        )
    ]
)

# Query document store
async def search_docs(
    query: str,
    docs: References,
    threshold: float = 0.7
) -> References:
    results = References()
    query_embedding = await generate_embedding(query)
    
    for file in docs.files:
        if file.embedding:
            similarity = compute_similarity(
                query_embedding,
                file.embedding[0]
            )
            if similarity > threshold:
                if not results.files:
                    results.files = []
                results.files.append(file)
    
    return results
```

### 4. Multi-Step Processing
```python
# Initial data gathering
step1_results = References(
    url_references=[web_data],
    string_outputs=[raw_text]
)

# Analysis phase
analysis_results = References(
    messages=[analysis_message],
    task_responses=[analysis_task]
)

# Final compilation
final_results = References(
    messages=[*step1_results.messages, *analysis_results.messages],
    task_responses=analysis_results.task_responses,
    url_references=step1_results.url_references
)
```

## Integration Points

### 1. Chat Context
```python
class AliceChat:
    messages: List[MessageDict]
    context: References
    
    def add_context(self, refs: References):
        # Merge new references with existing context
        if refs.messages:
            self.context.messages = (self.context.messages or []) + refs.messages
        # ... handle other reference types
```

### 2. Task Input/Output
```python
class AliceTask:
    data_cluster: Optional[References]
    
    async def run(self, **kwargs) -> TaskResponse:
        # Use data cluster in task execution
        if self.data_cluster:
            # Process references
            result = await self.process_with_context(
                self.data_cluster,
                **kwargs
            )
        # ... task execution logic
```

### 3. Agent Memory
```python
class AliceAgent:
    memory: References
    
    async def process_with_memory(
        self,
        prompt: str,
        api_manager: APIManager
    ) -> MessageDict:
        # Include relevant memory in context
        context = self.get_relevant_memory(prompt)
        
        # Generate response with context
        response = await self.generate_llm_response(
            api_manager=api_manager,
            messages=[*context.messages, prompt_message]
        )
        
        # Update memory
        self.update_memory(response)
```

## Best Practices

1. **Reference Management**
   - Keep references organized by type
   - Use appropriate reference types
   - Maintain clear relationships between references

2. **Context Control**
   - Limit context size for LLM interactions
   - Prioritize relevant references
   - Clean up temporary references

3. **Embedding Integration**
   - Embed searchable content
   - Update embeddings when content changes
   - Use appropriate similarity thresholds

4. **Storage Efficiency**
   - Clean up temporary files
   - Manage reference lifecycles
   - Handle large content appropriately