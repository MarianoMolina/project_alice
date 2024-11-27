import pytest
from typing import List
from workflow.util import (
    SemanticTextSplitter,
    SplitterType,
    LengthType,
    Language,
)
from pydantic import ValidationError

# Mock Embedding Generator for testing
class MockEmbeddingGenerator:
    async def generate_embedding(self, inputs: List[str]) -> List[List[float]]:
        # Generate simple mock embeddings based on text length for predictability
        return [
            [len(text) / 100, 0.5, 0.3] for text in inputs
        ]

@pytest.fixture
def mock_embedding_generator():
    return MockEmbeddingGenerator()

@pytest.fixture
def default_splitter():
    return SemanticTextSplitter()

def test_initialization_defaults():
    """Test default initialization parameters"""
    splitter = SemanticTextSplitter()
    assert splitter.splitter_type == SplitterType.SEMANTIC
    assert splitter.chunk_size == 500
    assert splitter.chunk_overlap == 0
    assert splitter.language == Language.TEXT
    assert splitter.length_function == LengthType.TOKEN
    assert splitter.similarity_threshold == 0.5

def test_custom_initialization():
    """Test custom initialization parameters"""
    splitter = SemanticTextSplitter(
        chunk_size=200,
        chunk_overlap=50,
        similarity_threshold=0.7,
        language=Language.PYTHON,
        length_function=LengthType.CHARACTER
    )
    assert splitter.chunk_size == 200
    assert splitter.chunk_overlap == 50
    assert splitter.similarity_threshold == 0.7
    assert splitter.language == Language.PYTHON
    assert splitter.length_function == LengthType.CHARACTER

def test_invalid_initialization():
    """Test invalid initialization parameters"""
    with pytest.raises(ValidationError):
        SemanticTextSplitter(similarity_threshold=1.5)
    
    with pytest.raises(ValidationError):
        SemanticTextSplitter(chunk_overlap=-1)
    
    with pytest.raises(ValidationError):
        SemanticTextSplitter(chunk_size=0)

@pytest.mark.asyncio
async def test_empty_text(mock_embedding_generator):
    """Test handling of empty text"""
    splitter = SemanticTextSplitter()
    chunks = await splitter.split_text("", mock_embedding_generator)
    assert chunks == ['']

@pytest.mark.asyncio
async def test_text_below_chunk_threshold(mock_embedding_generator):
    """Test that text shorter than 2*chunk_size is not split"""
    splitter = SemanticTextSplitter(chunk_size=100)
    text = "Short text that shouldn't be split because it's too small."
    chunks = await splitter.split_text(text, mock_embedding_generator)
    assert len(chunks) == 1
    assert chunks[0] == text

@pytest.mark.asyncio
async def test_long_text_splitting(mock_embedding_generator):
    """Test splitting of text longer than 2*chunk_size"""
    splitter = SemanticTextSplitter(
        chunk_size=50,
        length_function=LengthType.CHARACTER,
        similarity_threshold=0.5
    )
    
    # Create text that's definitely long enough to split
    text = "This is a test sentence. " * 20  # ~500 characters
    chunks = await splitter.split_text(text, mock_embedding_generator)
    
    assert len(chunks) > 1, "Long text should be split into multiple chunks"
    assert all(len(chunk) > 0 for chunk in chunks), "No empty chunks should be present"

@pytest.mark.asyncio
async def test_chunk_overlap(mock_embedding_generator):
    """Test that chunk overlap is handled correctly"""
    splitter = SemanticTextSplitter(
        chunk_size=50,
        chunk_overlap=20,
        length_function=LengthType.CHARACTER
    )
    
    text = "This is a test sentence. " * 10
    chunks = await splitter.split_text(text, mock_embedding_generator)
    
    if len(chunks) > 1:
        # Verify some text overlap between consecutive chunks
        for i in range(len(chunks) - 1):
            current = chunks[i]
            next_chunk = chunks[i + 1]
            # Check if there's any overlap in the text
            assert any(word in next_chunk for word in current.split()), \
                f"No overlap found between chunk {i} and {i+1}"

@pytest.mark.asyncio
async def test_error_handling(mock_embedding_generator):
    """Test error handling scenarios"""
    splitter = SemanticTextSplitter()
    
    # Test with None text
    with pytest.raises(TypeError):
        await splitter.split_text(None, mock_embedding_generator)
    
    # Test with non-string text
    with pytest.raises(TypeError):
        await splitter.split_text(123, mock_embedding_generator)

@pytest.mark.asyncio
async def test_different_similarity_thresholds(mock_embedding_generator):
    """Test how different similarity thresholds affect splitting"""
    text = "First topic. " * 10 + "Second topic. " * 10 + "Third topic. " * 10
    
    # Test with different thresholds
    results = {}
    for threshold in [0.3, 0.7, 0.9]:
        splitter = SemanticTextSplitter(
            chunk_size=50,
            similarity_threshold=threshold,
            length_function=LengthType.CHARACTER
        )
        chunks = await splitter.split_text(text, mock_embedding_generator)
        results[threshold] = len(chunks)
    
    # Lower thresholds should generally result in fewer chunks
    # as we're more lenient about considering text segments similar
    assert results[0.3] <= results[0.7], \
        "Lower similarity threshold should produce fewer or equal chunks"