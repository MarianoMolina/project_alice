from workflow.core.data_structures.base_models import Embeddable
from workflow.core.data_structures.api_utils import ApiType
from pydantic import HttpUrl, Field, BaseModel
from typing import Optional, List
from enum import Enum

class ReferenceCategory(str, Enum):
    URL = "URL"
    PERSON = "Person"
    ORGANIZATION = "Organization"
    LOCATION = "Location"
    EVENT = "Event"
    WORK = "Work"
    CONCEPT = "Concept"
    TECHNOLOGY = "Technology"
    BIOLOGICAL_ENTITY = "Biological Entity"
    NATURAL_PHENOMENON = "Natural Phenomenon"
    OTHER = "Other"

class EntityConnection(BaseModel):
    entity_id: str
    similarity_score: float

class ImageReference(BaseModel):
    url: HttpUrl
    caption: Optional[str] = Field(None, description="Optional caption or description for the image.")
    license: Optional[HttpUrl] = Field(None, description="License URL for the image.")

class EntityReference(Embeddable):
    source_id: Optional[str] = Field(None, description="The unique identifier for the entity in the source system.")
    name: Optional[str] = Field(None, description="The name/title of the entity.")
    description: Optional[str] = Field(None, description="A description/summary/extract, etc. of the entity.")
    content: Optional[str] = Field(None, description="The full content of the entity.")
    url: Optional[HttpUrl] = Field(None, description="The URL of the entity.")
    images: List[ImageReference] = Field(default_factory=list, description="List of images related to the entity.")
    categories: List[ReferenceCategory] = Field(default_factory=list, description="The categories of the entity.")
    source: Optional[ApiType] = Field(None, description="The ApiType source of the entity.")
    connections: List[EntityConnection] = Field(default_factory=list, description="The connections of the entity.")
    metadata: Optional[dict] = Field(None, description="Additional metadata for the entity.")
    
    class Config:
        allow_population_by_field_name = True
        extra = 'allow'

    def __str__(self) -> str:
        """
        Returns a human-readable string representation of the EntityReference.
        Includes key information while handling optional fields gracefully.
        """
        parts = []
        
        # Add name if available
        if self.name:
            parts.append(f"Name: {self.name}")
        
        # Add source ID if available
        if self.source_id:
            parts.append(f"ID: {self.source_id}")
            
        # Add categories if available
        if self.categories:
            categories_str = ", ".join(str(cat) for cat in self.categories)
            parts.append(f"Categories: [{categories_str}]")
            
        # Add truncated description if available
        if self.description:
            desc = self.description[:100] + "..." if len(self.description) > 100 else self.description
            parts.append(f"Description: {desc}")
            
        # Add source if available
        if self.source:
            parts.append(f"Source: {self.source}")
            
        # Add number of connections if any exist
        if self.connections:
            parts.append(f"Connections: {len(self.connections)}")
            
        # Add number of images if any exist
        if self.images:
            parts.append(f"Images: {len(self.images)}")
            
        # Join all parts with separators
        return "\n".join(parts)