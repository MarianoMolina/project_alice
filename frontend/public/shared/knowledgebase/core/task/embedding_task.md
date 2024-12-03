# EmbeddingTask

A focused task for generating text embeddings. Uses a single node to handle both individual and batch embedding generation with language awareness.

## Key Features
- Single-node design
- Language-specific processing
- Batch embedding support
- Consistent vector dimensionality

## Usage
```python
embedding_task = EmbeddingTask(
    agent=agent_with_embeddings,
    task_name="text_embedder",
    task_description="Generate text embeddings"
)

embeddings = await embedding_task.run(
    input="Text to embed",
)
```

### Input Parameters
```python
{
    "input": {
        "type": "string",
        "description": "The input text to get embeddings for"
    }
}
```

### Node Structure
Single node workflow with straightforward routing:
```python
node_end_code_routing = {
    'generate_embedding': {
        0: (None, False),   # Success, end task
        1: ('generate_embedding', True)  # Retry on failure
    }
}
```

## Usage Examples

### Basic Usage
```python
task = EmbeddingTask(
    agent=some_agent,
    task_name="get_embeddings",
    task_description="Generate embeddings for text input"
)

response = await task.run(
    api_manager=api_manager,
    input="Text to embed"
)
```

### Accessing Results
```python
# Get embeddings from response
if response.status == "complete":
    embeddings = response.node_references[-1].references.embeddings
    for chunk in embeddings:
        print(f"Vector: {chunk.vector}")
        print(f"Text: {chunk.text_content}")
        print(f"Index: {chunk.index}")
```

## Error Handling

The task provides detailed error information in case of failures:

```python
except Exception as e:
    return NodeResponse(
        parent_task_id=self.id,
        node_name="generate_embedding",
        exit_code=1,
        references=References(messages=[MessageDict(
            role="system",
            content=f"Embedding generation failed: {str(e)}\n\n" + get_traceback(),
            generated_by="system"
        )])
    )
```