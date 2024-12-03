from typing import Dict, Optional
from pydantic import BaseModel, Field

class ToolNameMapping(BaseModel):
    """
    Pydantic model for storing tool name mappings and their conversion logic.
    """
    original_to_valid: Dict[str, str] = Field(default_factory=dict)
    valid_to_original: Dict[str, str] = Field(default_factory=dict)

    def make_compliant_name(self, name: str) -> str:
        """Convert a tool name to be compliant with Anthropic's naming requirements."""
        # Replace any non-alphanumeric characters (except underscores and hyphens) with underscores
        valid_name = ''.join(c if c.isalnum() or c in '_-' else '_' for c in name)
        
        # Ensure it starts with a lowercase letter
        if valid_name and valid_name[0].isupper():
            valid_name = valid_name[0].lower() + valid_name[1:]
        
        # If it starts with a number or special character, prepend 'tool_'
        if not valid_name or not valid_name[0].isalpha():
            valid_name = f"tool_{valid_name}"
            
        return valid_name[:64]  # Ensure it doesn't exceed 64 characters

    def register_tool(self, original_name: str) -> str:
        """Register a tool name and get its compliant version."""
        if original_name in self.original_to_valid:
            return self.original_to_valid[original_name]
            
        valid_name = self.make_compliant_name(original_name)
        
        # Handle potential collisions
        base_name = valid_name
        counter = 1
        while valid_name in self.valid_to_original:
            valid_name = f"{base_name}_{counter}"
            counter += 1
            if len(valid_name) > 64:
                valid_name = f"{base_name[:59]}_{counter}"
                
        self.original_to_valid[original_name] = valid_name
        self.valid_to_original[valid_name] = original_name
        return valid_name

    def get_original_name(self, valid_name: str) -> Optional[str]:
        """Retrieve the original tool name from a valid name."""
        return self.valid_to_original.get(valid_name)
