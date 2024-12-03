import json
import yaml
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional
from dataclasses import dataclass, field

@dataclass
class TestOutputConfig:
    """Configuration for test output handling."""
    output_dir: Path = field(default_factory=lambda: Path("test_outputs"))
    format: str = "json"  # Supported formats: json, yaml
    create_timestamp_dir: bool = True
    pretty_print: bool = True

class TestOutputHandler:
    """Handles storing and retrieving test outputs in various formats."""
    
    SUPPORTED_FORMATS = {
        "json": {"ext": ".json", "content_type": "application/json"},
        "yaml": {"ext": ".yaml", "content_type": "application/x-yaml"}
    }
    
    def __init__(self, config: Optional[TestOutputConfig] = None):
        self.config = config or TestOutputConfig()
        self._setup_output_directory()
    
    def _setup_output_directory(self) -> None:
        """Create the output directory structure."""
        if self.config.create_timestamp_dir:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            self.output_dir = self.config.output_dir / timestamp
        else:
            self.output_dir = self.config.output_dir
        
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def save_output(self, data: Dict[str, Any], filename: str) -> Path:
        """
        Save test output data to a file.
        
        Args:
            data: The data to save
            filename: Name of the output file (without extension)
            
        Returns:
            Path to the saved file
        """
        if self.config.format not in self.SUPPORTED_FORMATS:
            raise ValueError(f"Unsupported format: {self.config.format}")
        
        ext = self.SUPPORTED_FORMATS[self.config.format]["ext"]
        output_path = self.output_dir / f"{filename}{ext}"
        
        with output_path.open("w") as f:
            if self.config.format == "json":
                json.dump(
                    data,
                    f,
                    indent=2 if self.config.pretty_print else None,
                    sort_keys=True
                )
            elif self.config.format == "yaml":
                yaml.dump(
                    data,
                    f,
                    sort_keys=True,
                    allow_unicode=True,
                    default_flow_style=False if self.config.pretty_print else True
                )
        
        return output_path
    
    def load_output(self, filename: str) -> Dict[str, Any]:
        """
        Load test output data from a file.
        
        Args:
            filename: Name of the output file (without extension)
            
        Returns:
            The loaded data
        """
        ext = self.SUPPORTED_FORMATS[self.config.format]["ext"]
        input_path = self.output_dir / f"{filename}{ext}"
        
        if not input_path.exists():
            raise FileNotFoundError(f"Output file not found: {input_path}")
        
        with input_path.open("r") as f:
            if self.config.format == "json":
                return json.load(f)
            elif self.config.format == "yaml":
                return yaml.safe_load(f)