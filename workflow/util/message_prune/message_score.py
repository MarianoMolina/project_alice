import math
from typing import Dict
from pydantic import BaseModel, Field
from workflow.util.message_prune.message_prune_utils import RoleTypes, calculate_content_size, calculate_tool_size, MessageApiFormat

class MessageScore(BaseModel):
    """Detailed breakdown of message scoring components"""
    base_score: float = Field(
        ...,
        ge=0.0, le=1.0,
        description="Base score from message length"
    )
    role_multiplier: float = Field(
        ...,
        ge=0.0, le=1.0,
        description="Score multiplier based on message role"
    )
    position_score: float = Field(
        ...,
        ge=0.0, le=1.0,
        description="Score component based on message position"
    )
    final_score: float = Field(
        ...,
        ge=0.0, le=1.0,
        description="Final combined score"
    )

    def __str__(self) -> str:
        return (
            f"MessageScore:\n"
            f"  Base Score: {self.base_score:.3f}\n"
            f"  Role Multiplier: {self.role_multiplier:.3f}\n"
            f"  Position Score: {self.position_score:.3f}\n"
            f"  Final Score: {self.final_score:.3f}"
        )

class ScoreConfig(BaseModel):
    """Configuration for message scoring behavior"""   
    # Sigmoid steepness for position scoring
    position_steepness: float = Field(
        default=10.0,
        ge=0.0,
        description="Controls how sharply the position score transitions from edges to middle."
    )
    
    # Role multipliers (higher = more likely to be pruned)
    role_multipliers: Dict[RoleTypes, float] = Field(
        default={
            RoleTypes.SYSTEM: 0.3,    # Least likely to prune
            RoleTypes.USER: 0.6,      # Important to keep
            RoleTypes.TOOL: 0.7,      # Somewhat important
            RoleTypes.ASSISTANT: 1   # Most likely to prune
        },
        description="Multiplier for each role affecting pruning likelihood"
    )
    
    # Weight factors
    role_weight: float = Field(
        default=1.0,
        ge=0.0,
        description="Weight for role-based scoring"
    )
    position_weight: float = Field(
        default=1.0,
        ge=0.0,
        description="Weight for position-based scoring"
    )
    length_weight: float = Field(
        default=1.0,
        ge=0.0,
        description="Weight for length-based scoring"
    )

class MessageStats(BaseModel):
    """
    Normalized statistics about a message in a conversation.
    All values are normalized to [0,1] range where applicable.
    """
    position: float = Field(
        ...,
        ge=0.0, le=1.0,
        description="Position in conversation (0=first, 1=last)"
    )
    length: float = Field(
        ...,
        ge=0.0, le=1.0,
        description="Length relative to total conversation length"
    )
    role: RoleTypes = Field(
        ...,
        description="Role of the message sender"
    )
    tool_length: float = Field(
        default=0.0,
        ge=0.0, le=1.0,
        description="Tool call length relative to total conversation length"
    )

    def _calculate_position_factor(self, steepness: float) -> float:
        """
        Calculate position factor using sigmoid function.
        Returns close to 1 for edge positions, close to 0 for middle positions.
        
        Args:
            steepness: Controls how sharp the transition is from edges to middle
        """
        # Transform position to be centered around 0 
        x = (self.position - 0.5) * 2
        
        # Use sigmoid to create symmetric peaks at both ends
        # Add 1 and divide by 2 to normalize to [0,1]
        # Invert the result to get high values at edges
        return 1 - (1 / (1 + math.exp(-steepness * (abs(x) - 0.5))))

    def calculate_score(self, config: ScoreConfig) -> MessageScore:
        """
        Calculate pruning score and return detailed scoring components.
        
        Returns:
            tuple containing:
            - final score (0=keep, 1=prune)
            - MessageScore object with detailed scoring breakdown
        """

        # Get role multiplier from config
        role_multiplier = config.role_multipliers[self.role] * config.role_weight

        # Position score using sigmoid
        position_score = self._calculate_position_factor(config.position_steepness) * config.position_weight

        # Base score from length weighted by config
        base_score = (self.length + self.tool_length) * config.length_weight

        # Combine factors
        final_score = min(max(
            base_score *
            role_multiplier *
            position_score,
            0.0
        ), 1.0)

        # Create MessageScore object with all components
        message_score = MessageScore(
            base_score=base_score,
            role_multiplier=role_multiplier,
            position_score=position_score,
            final_score=final_score
        )

        return message_score
    
    @classmethod
    def from_message(
        cls,
        message: MessageApiFormat,
        index: int,
        total_messages: int,
        total_length: int
    ) -> "MessageStats":
        """
        Create MessageStats from a message and its context.
        
        Args:
            message: The MessageApiFormat with role, content, etc.
            index: Position in the message list
            total_messages: Total number of messages
            total_length: Total length of all messages
        """
        # Calculate position in [0,1]
        position = index / (total_messages - 1) if total_messages > 1 else 0.0
        
        # Calculate normalized content length
        length = calculate_content_size(message) / total_length if total_length > 0 else 0.0
        
        # Calculate normalized tool length
        tool_length = calculate_tool_size(message) / total_length if total_length > 0 else 0.0

        return cls(
            position=position,
            length=length,
            role=RoleTypes(message["role"]),
            tool_length=tool_length
        )