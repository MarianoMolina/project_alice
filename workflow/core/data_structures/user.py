import datetime
from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional

class UserRoles(str, Enum):
    USER = "user"
    ADMIN = "admin"

class User(BaseModel):
    id: Optional[str] = Field(None, description="User's ID", alias="_id")
    name: str = Field(..., description="User's name")
    email: str = Field(..., description="User's email")
    password: Optional[str] = Field(None, description="User's password")
    role: UserRoles = Field('user', description="User's role")
    createdAt: Optional[datetime.datetime] = Field(None, description="User's creation date")
    updatedAt: Optional[datetime.datetime] = Field(None, description="User's last update date")