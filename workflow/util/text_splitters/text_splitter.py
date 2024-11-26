import re
from typing import List, Iterable, Optional, Protocol
from pydantic import BaseModel, Field
from enum import Enum
from workflow.util.code_utils import Language
from workflow.util.text_splitters.utils.regex_utils import split_text_with_regex
from workflow.util.text_splitters.utils.token_utils import est_token_count
from workflow.util.logger import LOGGER
from workflow.util.code_utils import get_separators_for_language

class EmbeddingGenerator(Protocol):
    """Protocol defining the interface for embedding generation"""
    async def generate_embedding(self, inputs: List[str]) -> List[List[float]]:
        """Generate embeddings for the given inputs."""
        ...
        
class LengthType(str, Enum):
    """Enum for different types of length functions"""
    TOKEN = "token"
    CHARACTER = "character"

class SplitterType(str, Enum):
    """Enum for different types of text splitters"""
    SEMANTIC = "semantic"
    RECURSIVE = "recursive"

class TextSplitter(BaseModel):
    """Base class for text splitters"""
    splitter_type: SplitterType = Field(
        default=SplitterType.RECURSIVE,
        description="Type of text splitter being used"
    )
    chunk_size: int = Field(
        default=500,
        gt=0,
        description="Target size for each text chunk"
    )
    chunk_overlap: int = Field(
        default=100,
        ge=0,
        description="Number of tokens to overlap between chunks, if the selected method includes this"
    )
    language: Language = Field(
        default=Language.TEXT,
        description="Language to use for splitting text"
    )
    length_function: LengthType = Field(
        default=LengthType.TOKEN,
        description="Metric to use for calculating length: 'token' or 'character'"
    )
    is_separator_regex: bool = Field(
        default=False,
        description="Whether separators should be treated as regex patterns"
    )
    separators: Optional[List[str]] = Field(
        default=None,
        description="Custom separators to use for splitting. If None, defaults will be used based on language"
    )
    keep_separator: bool = Field(
        default=True,
        description="Whether to keep separators in the output"
    )
    strip_whitespace: bool = Field(
        default=True,
        description="Whether to strip leading and trailing whitespace from chunks"
    )
    similarity_threshold: float = Field(
        default=0.0,
        ge=0.0, le=1.0,
        description="Threshold for cosine similarity between sentence embeddings, if the method uses this"
    )

    class Config:
        arbitrary_types_allowed = True

    def split_text(self, text: str, embedding_generator: EmbeddingGenerator = None) -> List[str]:
        separators = self.separators or get_separators_for_language(self.language)
        return self._recursive_split_text(text, separators)

    def get_string_size(self, text: str) -> int:
        """
        Calculate the size of a chunk of text using the configured length function.
        
        Args:
            text: Text to measure
            
        Returns:
            Size of the text according to the configured length function
        """
        if self.length_function == "token":
            return est_token_count(text)
        elif self.length_function == "character":
            return len(text)
        else:
            raise ValueError(f"Unknown length function: {self.length_function}")

    def _recursive_split_text(self, text: str, separators: List[str]) -> List[str]:
        """Split incoming text and return chunks."""
        final_chunks = []
        # Get appropriate separator to use
        separator = separators[-1]
        new_separators = []
        for i, _s in enumerate(separators):
            _separator = _s if self.is_separator_regex else re.escape(_s)
            if _s == "":
                separator = _s
                break
            if re.search(_separator, text):
                separator = _s
                new_separators = separators[i + 1 :]
                break

        _separator = separator if self.is_separator_regex else re.escape(separator)
        chunks = split_text_with_regex(text, _separator, self.keep_separator)

        # Now go merging things, recursively splitting longer texts.
        _good_chunks = []
        _separator = "" if self.keep_separator else separator
        for s in chunks:
            if self.get_string_size(s) < self.chunk_size:
                _good_chunks.append(s)
            else:
                if _good_chunks:
                    merged_text = self._merge_chunks(_good_chunks, _separator)
                    final_chunks.extend(merged_text)
                    _good_chunks = []
                if not new_separators:
                    final_chunks.append(s)
                else:
                    other_info = self._recursive_split_text(s, new_separators)
                    final_chunks.extend(other_info)
        if _good_chunks:
            merged_text = self._merge_chunks(_good_chunks, _separator)
            final_chunks.extend(merged_text)
        return final_chunks
        
    def _merge_chunks(self, chunks: Iterable[str], separator: str) -> List[str]:
        # We now want to combine these smaller pieces into medium size
        # chunks to send to the LLM.
        separator_len = self.get_string_size(separator)

        docs = []
        current_doc: List[str] = []
        total = 0
        for d in chunks:
            _len = self.get_string_size(d)
            if (
                total + _len + (separator_len if len(current_doc) > 0 else 0)
                > self.chunk_size
            ):
                if total > self.chunk_size:
                    LOGGER.warning(
                        f"Created a chunk of size {total}, "
                        f"which is longer than the specified {self.chunk_size}"
                    )
                if len(current_doc) > 0:
                    doc = self._join_docs(current_doc, separator)
                    if doc is not None:
                        docs.append(doc)
                    # Keep on popping if:
                    # - we have a larger chunk than in the chunk overlap
                    # - or if we still have any chunks and the length is long
                    while total > self.chunk_overlap or (
                        total + _len + (separator_len if len(current_doc) > 0 else 0)
                        > self.chunk_size
                        and total > 0
                    ):
                        total -= self.get_string_size(current_doc[0]) + (
                            separator_len if len(current_doc) > 1 else 0
                        )
                        current_doc = current_doc[1:]
            current_doc.append(d)
            total += _len + (separator_len if len(current_doc) > 1 else 0)
        doc = self._join_docs(current_doc, separator)
        if doc is not None:
            docs.append(doc)
        return docs
    
    def _join_docs(self, docs: List[str], separator: str) -> Optional[str]:
        text = separator.join(docs)
        if self.strip_whitespace:
            text = text.strip()
        if text == "":
            return None
        else:
            return text