from workflow.core.data_structures.base_models import Embeddable, HttpUrlString
from workflow.util import LOGGER
from workflow.core.data_structures.api_utils import ApiType
from pydantic import HttpUrl, Field, BaseModel
from pydantic_core import Url
from typing import Optional, Any, List
from enum import Enum

class ReferenceCategory(str, Enum):
    # URLS
    URL = "URL"
    WEBSITE = "WebSite"
    # SCHEMA TYPES
    ## Works
    WORK = "Work"
    BOOK = "Book"
    BOOK_SERIES = "BookSeries"
    MOVIE = "Movie"
    MOVIE_SERIES = "MovieSeries"
    MUSIC_ALBUM = "MusicAlbum"
    MUSIC_GROUP = "MusicGroup"
    MUSIC_RECORDING = "MusicRecording"
    PERIODICAL = "Periodical"
    CONCEPT = "Concept"
    TV_SERIES = "TVSeries"
    TV_EPISODE = "TVEpisode"
    VIDEO_GAME = "VideoGame"
    VIDEO_GAME_SERIES = "VideoGameSeries"

    ## Things
    PERSON = "Person"
    PLACE = "Place"
    BIOLOGICAL_ENTITY = "BiologicalEntity"
    TECHNOLOGY = "Technology"
    NATURAL_PHENOMENON = "NaturalPhenomenon"
    SPORTS_TEAM = "SportsTeam"

    ## Organizations
    ORGANIZATION = "Organization"
    EDUCATIONAL_ORGANIZATION = "EducationalOrganization"
    GOVERNMENT_ORGANIZATION = "GovernmentOrganization"
    LOCAL_BUSINESS = "LocalBusiness"
    LOCATION = "Location"
    EVENT = "Event"

    OTHER = "Other"

class EntityConnection(BaseModel):
    entity_id: str
    similarity_score: float

class ImageReference(BaseModel):
    url: HttpUrlString
    caption: Optional[str] = Field(None, description="Optional caption or description for the image.")
    license: Optional[HttpUrlString] = Field(None, description="License URL for the image.")
    model_config = {
        "json_encoders": {
            HttpUrl: str,
            Url: str
        }
    }
    
class EntityReference(Embeddable):
    source_id: Optional[str] = Field(None, description="The unique identifier for the entity in the source system.")
    name: Optional[str] = Field(None, description="The name/title of the entity.")
    description: Optional[str] = Field(None, description="A description/summary/extract, etc. of the entity.")
    content: Optional[str] = Field(None, description="The full content of the entity.")
    url: Optional[HttpUrlString] = Field(None, description="The URL of the entity.")
    images: List[ImageReference] = Field(default_factory=list, description="List of images related to the entity.")
    categories: List[ReferenceCategory] = Field(default_factory=list, description="The categories of the entity.")
    source: Optional[ApiType] = Field(None, description="The ApiType source of the entity.")
    connections: List[EntityConnection] = Field(default_factory=list, description="The connections of the entity.")
    metadata: Optional[dict] = Field(None, description="Additional metadata for the entity.")

    def model_dump(self, *args, **kwargs):
        LOGGER.debug(f"Dumping EntityReference: {self.name}")
        LOGGER.debug(f"Url is: {self.url} with type {type(self.url)}")
        return super().model_dump(*args, **kwargs)
    
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

        if self.url:
            parts.append(f"URL: {self.url}")
            
        # Add source if available
        if self.source:
            parts.append(f"Source: {self.source}")
            
        # Add number of connections if any exist
        if self.connections:
            parts.append(f"Connections: {len(self.connections)}")
            
        # Add number of images if any exist
        if self.images:
            parts.append(f"Images: {len(self.images)}")
            
        if self.description:
            parts.append(f"Description: {self.description}")

        if self.content:
            parts.append(f"Content: {self.content}")
            
        # Join all parts with separators
        return "\n".join(parts)