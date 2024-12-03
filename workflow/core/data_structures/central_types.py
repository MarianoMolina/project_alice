from __future__ import annotations
from typing import TypeVar, Annotated, TYPE_CHECKING

if TYPE_CHECKING:
    from .parameters import ToolCall
    from .references import References


T = TypeVar('T')

ToolCallType = Annotated[T, "ToolCall"]
ReferencesType = Annotated[T, "References"]