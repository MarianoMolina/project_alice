import pytest
from pydantic import ValidationError

from workflow.util.text_splitters.text_splitter import (
    TextSplitter,
    SplitterType,
    LengthType,
    Language
)
from workflow.util.const import CHAR_PER_TOKEN

# Fixtures
@pytest.fixture
def default_splitter():
    return TextSplitter()

@pytest.fixture
def custom_splitter():
    return TextSplitter(
        chunk_size=100,
        chunk_overlap=20,
        language=Language.PYTHON,
        length_function=LengthType.CHARACTER,
        is_separator_regex=True,
        separators=["\n\n", "\n", " ", ""],
        keep_separator=False,
        strip_whitespace=True
    )

# Initialization Tests
def test_default_initialization():
    splitter = TextSplitter()
    assert splitter.splitter_type == SplitterType.RECURSIVE
    assert splitter.chunk_size == 500
    assert splitter.chunk_overlap == 100
    assert splitter.language == Language.TEXT
    assert splitter.length_function == LengthType.TOKEN
    assert not splitter.is_separator_regex
    assert splitter.keep_separator is True
    assert splitter.strip_whitespace is True

def test_custom_initialization():
    splitter = TextSplitter(
        chunk_size=200,
        chunk_overlap=50,
        language=Language.PYTHON
    )
    assert splitter.chunk_size == 200
    assert splitter.chunk_overlap == 50
    assert splitter.language == Language.PYTHON

def test_invalid_initialization():
    with pytest.raises(ValidationError):
        TextSplitter(chunk_size=-1)
    
    with pytest.raises(ValidationError):
        TextSplitter(chunk_overlap=-1)
        
    with pytest.raises(ValidationError):
        TextSplitter(similarity_threshold=1.5)

# String Size Calculation Tests
def test_token_length_calculation(default_splitter):
    text = "This is a test sentence."
    expected_tokens = len(text) // CHAR_PER_TOKEN
    actual_tokens = default_splitter.get_string_size(text)
    assert actual_tokens == expected_tokens, f"Expected {expected_tokens} tokens but got {actual_tokens}. CHAR_PER_TOKEN={CHAR_PER_TOKEN}"

def test_character_length_calculation(custom_splitter):
    text = "This is a test sentence."
    assert custom_splitter.get_string_size(text) == len(text)

def test_invalid_length_function():
    """Test that an invalid length_function value raises a ValidationError"""
    with pytest.raises(ValidationError) as exc_info:
        TextSplitter(length_function="invalid")
    assert "length_function" in str(exc_info.value)

# Text Splitting Tests
def test_basic_text_splitting(default_splitter):
    text = "This is a test. This is another test. " * 50
    chunks = default_splitter.split_text(text)
    assert len(chunks) > 1
    assert all(len(chunk) > 0 for chunk in chunks)

def test_splitting_with_custom_separators():
    splitter = TextSplitter(
        chunk_size=20,  # Smaller chunk size to force splitting
        length_function=LengthType.CHARACTER,
        separators=["\n\n"],
        is_separator_regex=False
    )
    text = "def function1():\n    pass\n\ndef function2():\n    pass"
    chunks = splitter.split_text(text)
    assert len(chunks) == 2, f"Expected 2 chunks but got {len(chunks)}: {chunks}"

def test_splitting_with_regex_separators():
    splitter = TextSplitter(
        is_separator_regex=True,
        separators=[r"\d+\.", r"\s+", ""],
        chunk_size=20,
        length_function=LengthType.CHARACTER
    )
    text = "1. First item 2. Second item 3. Third item"
    chunks = splitter.split_text(text)
    assert len(chunks) > 1
    assert any("First" in chunk for chunk in chunks)
    assert any("Second" in chunk for chunk in chunks)
    assert any("Third" in chunk for chunk in chunks)

def test_empty_text_splitting(default_splitter):
    assert default_splitter.split_text("") == []

def test_whitespace_handling():
    splitter = TextSplitter(strip_whitespace=True)
    text = "  This has whitespace  \n\n  Around it  "
    chunks = splitter.split_text(text)
    assert all(not chunk.startswith(" ") for chunk in chunks)
    assert all(not chunk.endswith(" ") for chunk in chunks)

def test_chunk_size_respect():
    # Create a splitter with character-based length for more predictable testing
    splitter = TextSplitter(
        chunk_size=50,
        chunk_overlap=10,
        length_function=LengthType.CHARACTER,
        separators=[" "]
    )
    text = "word " * 100
    chunks = splitter.split_text(text)
    for i, chunk in enumerate(chunks):
        chunk_size = splitter.get_string_size(chunk)
        assert chunk_size <= splitter.chunk_size * 1.1, \
            f"Chunk {i} size {chunk_size} exceeds maximum allowed size {splitter.chunk_size * 1.1}"
        
def test_chunk_overlap():
    splitter = TextSplitter(
        chunk_size=100,
        chunk_overlap=20,
        length_function=LengthType.CHARACTER,
        separators=[" "]
    )
    text = "word " * 50
    chunks = splitter.split_text(text)
    if len(chunks) > 1:
        # Check that consecutive chunks have some overlap
        for i in range(len(chunks) - 1):
            current_words = set(chunks[i].split())
            next_words = set(chunks[i + 1].split())
            assert len(current_words & next_words) > 0

def test_separator_handling():
    """Test different separator handling scenarios"""
    # Test case 1: Basic splitting with period
    splitter = TextSplitter(
        chunk_size=20,  # Smaller chunk size to force splitting
        length_function=LengthType.CHARACTER,
        keep_separator=True,
        separators=["."]
    )
    text = "This is a sentence. This is another one. And here is a third. And a fourth one."
    chunks = splitter.split_text(text)
    print(f"Generated chunks (length {len(chunks)}): {chunks}")  # Debug print
    assert len(chunks) > 1, "Text should be split into multiple chunks"
    
    # Test longer text with various chunk sizes
    text_sizes = [10, 20, 30, 40]
    for chunk_size in text_sizes:
        splitter = TextSplitter(
            chunk_size=chunk_size,
            length_function=LengthType.CHARACTER,
            keep_separator=True,
            separators=["."]
        )
        chunks = splitter.split_text(text)
        print(f"Chunk size {chunk_size} produced {len(chunks)} chunks: {chunks}")  # Debug print
        
        # For small chunk sizes, we should get multiple chunks
        if chunk_size < len(text) / 2:
            assert len(chunks) > 1, f"Text should be split into multiple chunks with chunk_size={chunk_size}"
            
        # Verify no empty chunks
        assert all(len(chunk) > 0 for chunk in chunks), "No empty chunks should be present"

def test_separator_with_overlap():
    """Test separator handling with chunk overlap"""
    splitter = TextSplitter(
        chunk_size=30,
        chunk_overlap=10,
        length_function=LengthType.CHARACTER,
        keep_separator=True,
        separators=[" "]
    )
    text = "This is a long text that should be split into multiple chunks with overlap"
    chunks = splitter.split_text(text)
    
    # Verify we have multiple chunks
    assert len(chunks) > 1, "Text should be split into multiple chunks"
    
    # Verify overlap exists between consecutive chunks
    for i in range(len(chunks) - 1):
        words_current = set(chunks[i].split())
        words_next = set(chunks[i + 1].split())
        common_words = words_current & words_next
        assert len(common_words) > 0, f"No overlap found between chunks {i} and {i+1}"

def test_separator_not_keeping():
    """Test that separators are properly removed when keep_separator is False"""
    splitter = TextSplitter(
        chunk_size=20,
        length_function=LengthType.CHARACTER,
        keep_separator=False,
        separators=["."]
    )
    text = "First sentence. Second sentence. Third sentence."
    chunks = splitter.split_text(text)
    
    # Check that no chunks end with the separator (except possibly the last one)
    for i, chunk in enumerate(chunks[:-1]):
        assert not chunk.endswith("."), f"Chunk {i} ends with separator when it shouldn't: '{chunk}'"

# Edge Cases and Special Scenarios
def test_single_chunk_case(default_splitter):
    short_text = "This is a short text."
    chunks = default_splitter.split_text(short_text)
    assert len(chunks) == 1
    assert chunks[0] == short_text

def test_long_unbreakable_chunk():
    splitter = TextSplitter(
        chunk_size=20,
        length_function=LengthType.CHARACTER,
        separators=[" "]
    )
    text = "ThisIsAVeryLongWordThatCannotBeBroken"
    chunks = splitter.split_text(text)
    assert len(chunks) == 1
    assert chunks[0] == text

def test_unicode_text_handling(default_splitter):
    text = "Hello 👋 World 🌍! This is a test with émojis and àccents."
    chunks = default_splitter.split_text(text)
    assert all(isinstance(chunk, str) for chunk in chunks)
    
def test_consecutive_separators():
    splitter = TextSplitter(
        chunk_size=20,
        length_function=LengthType.CHARACTER,
        separators=["\n"]
    )
    text = "First\n\nSecond\n\n\nThird"
    chunks = splitter.split_text(text)
    assert len(chunks) > 1
    assert all(chunk.strip() for chunk in chunks)

def test_text_splitting_behavior():
    """Test specific text splitting behaviors"""
    test_cases = [
        {
            "chunk_size": 15,
            "text": "Short. Very. Small. Texts.",
            "expected_min_chunks": 2,
            "desc": "Short sentences with small chunk size"
        },
        {
            "chunk_size": 10,
            "text": "A.B.C.D.E.F.G.H.I.J.",
            "expected_min_chunks": 3,
            "desc": "Very short splits with tiny chunk size"
        },
        {
            "chunk_size": 30,
            "text": "This is a longer sentence. This should split. More text here.",
            "expected_min_chunks": 2,
            "desc": "Medium sentences with medium chunk size"
        }
    ]
    
    for case in test_cases:
        splitter = TextSplitter(
            chunk_size=case["chunk_size"],
            length_function=LengthType.CHARACTER,
            keep_separator=True,
            separators=["."]
        )
        chunks = splitter.split_text(case["text"])
        print(f"\nTest case: {case['desc']}")
        print(f"Chunk size: {case['chunk_size']}")
        print(f"Text length: {len(case['text'])}")
        print(f"Generated {len(chunks)} chunks: {chunks}")
        
        assert len(chunks) >= case["expected_min_chunks"], \
            f"Expected at least {case['expected_min_chunks']} chunks for {case['desc']}, " \
            f"but got {len(chunks)}: {chunks}"

def test_recursive_splitting_behavior():
    """Test how the splitter handles recursive splitting with nested separators"""
    splitter = TextSplitter(
        chunk_size=20,
        length_function=LengthType.CHARACTER,
        keep_separator=True,
        separators=["\n\n", "\n", ".", " "]  # Ordered from largest to smallest
    )
    
    text = """First paragraph.
    Second line here.
    
    New paragraph.
    More text."""
    
    chunks = splitter.split_text(text)
    print(f"\nRecursive splitting test:")
    print(f"Original text length: {len(text)}")
    print(f"Generated {len(chunks)} chunks: {chunks}")
    
    assert len(chunks) > 1, "Text should be split into multiple chunks"
    assert all(len(chunk) <= splitter.chunk_size * 1.1 for chunk in chunks), \
        "All chunks should be close to or smaller than chunk_size"

# Performance Test (optional, can be marked with pytest.mark.slow)
@pytest.mark.slow
def test_large_text_performance(default_splitter):
    large_text = "This is a test sentence. " * 10000
    import time
    start_time = time.time()
    chunks = default_splitter.split_text(large_text)
    end_time = time.time()
    assert end_time - start_time < 5  # Should process in under 5 seconds
    assert len(chunks) > 1