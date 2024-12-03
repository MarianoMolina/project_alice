from enum import Enum
from pydantic import Field
from typing import Optional
from workflow.core.data_structures.base_models import BaseDataStructure

class UserRoles(str, Enum):
    USER = "user"
    ADMIN = "admin"

class User(BaseDataStructure):
    name: str = Field(..., description="User's name")
    email: str = Field(..., description="User's email")
    password: Optional[str] = Field(None, description="User's password")
    role: UserRoles = Field('user', description="User's role")