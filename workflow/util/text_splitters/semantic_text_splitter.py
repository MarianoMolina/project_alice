import re
from typing import List, Any
from pydantic import Field
from workflow.util import LOGGER
from workflow.util.text_splitters.utils import cosine_similarity, est_token_count
from workflow.util.text_splitters.text_splitter import TextSplitter, SplitterType, EmbeddingGenerator

class SemanticTextSplitter(TextSplitter):
    splitter_type: SplitterType = SplitterType.SEMANTIC
    similarity_threshold: float = Field(
        default=0.5,
        ge=0.0, le=1.0,
        description="Threshold for cosine similarity between sentence embeddings, if the method uses this"
    )

    async def split_text(self, text: str, embedding_generator: EmbeddingGenerator, api_data: Any) -> List[str]:
        """Split text into semantically meaningful chunks. 
            Configs used:
            - chunk_size: Target size for each text chunk
            - chunk_overlap: Number of tokens to overlap between chunks
            - similarity_threshold: Threshold for cosine similarity between sentence embeddings, defaults to 0.5
        """
        # If the text is too short, return it as is
        if est_token_count(text) < self.chunk_size * 2:
            return [text]
            
        LOGGER.info(f"Semantic text chunking for input text with total char length {len(text)} "
                   f"with est token count {est_token_count(text)}")
        
        text_splitter = TextSplitter(
            chunk_size=self.chunk_size//4,
            chunk_overlap=0,
            length_function=self.length_function,
            language=self.language,
        )

        chunks = text_splitter.split_text(text)
        
        embeddings: List[List[float]] = await embedding_generator.generate_embedding(inputs=chunks, api_data=api_data)
        LOGGER.info(f"Generated embeddings count: {len(embeddings)}")
        
        breakpoints = self._find_breakpoints(embeddings, chunks)
        LOGGER.info(f"Breakpoints found: {breakpoints}")
        
        final_chunks = self._create_final_chunks(breakpoints, chunks)
        LOGGER.info(f"Final chunks generated: {len(final_chunks)} with total char length "
                   f"{[len(chunk) for chunk in final_chunks]}")
        
        return final_chunks
        
    def _create_final_chunks(
        self,
        breakpoints: List[int],
        chunks: List[str]
    ) -> List[str]:
        """Create final text chunks with proper overlap using TextSplitter for overlap boundaries."""
        if not self.chunk_overlap:
            return [' '.join(chunks[breakpoints[i]:breakpoints[i+1]]) 
                    for i in range(len(breakpoints)-1)]
        
        text_splitter = TextSplitter(
            chunk_size=self.chunk_overlap,
            chunk_overlap=0, 
            language=self.language,
            length_function=self.length_function,
        )
        
        final_chunks = []
        for idx in range(len(breakpoints) - 1):
            current_text = []
            
            # Get overlap from previous chunk if not first
            if idx > 0:
                prev_chunk = chunks[breakpoints[idx]-1]
                prev_splits = text_splitter.split_text(prev_chunk)
                if prev_splits:
                    current_text.append(prev_splits[-1])  # Take the last split that fits our overlap size
            
            # Add main chunk content
            current_text.extend(chunks[breakpoints[idx]:breakpoints[idx+1]])
            
            # Add overlap to next chunk if not last
            if idx < len(breakpoints) - 2:
                next_chunk = chunks[breakpoints[idx+1]]
                next_splits = text_splitter.split_text(next_chunk)
                if next_splits:
                    current_text.append(next_splits[0])  # Take the first split that fits our overlap size
            
            final_chunks.append(' '.join(current_text))
        
        return final_chunks
    
    def _find_breakpoints(
        self,
        embeddings: List[List[float]],
        windows: List[str]
    ) -> List[int]:
        """Find breakpoints based on semantic similarity and chunk size constraints.
        
        The method accounts for overlap in sizing by adjusting the effective chunk size:
        - Base chunk size is increased by 2x overlap to account for bidirectional overlap
        - Creates a break if current size >= MIN_SIZE and similarity is low
        - Forces a break if current size >= MAX_SIZE regardless of similarity
        
        Args:
            embeddings: List of embedding vectors for each text window
            windows: List of text windows corresponding to embeddings
            
        Returns:
            List of indices where text should be split
        """
        MIN_SIZE_RATIO = 0.8  # Minimum size before considering similarity
        MAX_SIZE_RATIO = 1.2  # Maximum size before forcing split
            
        breakpoints = [0]
        current_tokens = 0
        
        for i in range(1, len(embeddings)):
            similarity = cosine_similarity(embeddings[i - 1], embeddings[i])
            tokens = est_token_count(windows[i])
            current_tokens += tokens
            
            if (current_tokens >= self.chunk_size * MIN_SIZE_RATIO and 
                similarity < self.similarity_threshold) or \
            current_tokens >= self.chunk_size * MAX_SIZE_RATIO:
                breakpoints.append(i)
                current_tokens = 0
                    
        if breakpoints[-1] != len(windows):
            breakpoints.append(len(windows))
                
        return breakpoints