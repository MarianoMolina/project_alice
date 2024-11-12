from datetime import datetime, date, time
from decimal import Decimal
from typing import Any, Dict, List, Optional, Union
from uuid import UUID
import json
import re

# JSON Schema Type to Python Type mapping
type_map = {
    # Basic JSON types
    "string": str,
    "integer": int,
    "number": float,
    "boolean": bool,
    "array": list,
    "object": dict,
    "null": None,
    
    # String formats
    "string:date": date,
    "string:date-time": datetime,
    "string:time": time,
    "string:email": str,
    "string:uri": str,
    "string:uri-reference": str,
    "string:uuid": UUID,
    "string:hostname": str,
    "string:ipv4": str,
    "string:ipv6": str,
    "string:binary": bytes,
    "string:password": str,
    
    # Number formats
    "number:float": float,
    "number:double": float,
    "number:decimal": Decimal,
    
    # Integer formats
    "integer:int32": int,
    "integer:int64": int,
    "integer:uint32": int,
    "integer:uint64": int,
    
    # Array variations
    "array:string": List[str],
    "array:integer": List[int],
    "array:number": List[float],
    "array:boolean": List[bool],
    "array:object": List[dict],
    
    # Common object variations
    "object:string": Dict[str, str],
    "object:integer": Dict[str, int],
    "object:number": Dict[str, float],
    "object:boolean": Dict[str, bool],
    "object:any": Dict[str, Any],
    
    # Optional variations
    "optional:string": Optional[str],
    "optional:integer": Optional[int],
    "optional:number": Optional[float],
    "optional:boolean": Optional[bool],
    "optional:array": Optional[list],
    "optional:object": Optional[dict],
}

# Additional utility function to handle complex type resolution
def resolve_json_type(json_type: str, format: Optional[str] = None, nullable: bool = False) -> type:
    """
    Resolves JSON Schema type to Python type, taking into account format and nullability.
    
    Args:
        json_type: The JSON Schema type
        format: Optional format specifier
        nullable: Whether the type is nullable
        
    Returns:
        Corresponding Python type
    
    Examples:
        >>> resolve_json_type("string", "date")
        <class 'datetime.date'>
        >>> resolve_json_type("string", nullable=True)
        typing.Optional[str]
        >>> resolve_json_type("array", "string")
        typing.List[str]
    """
    # Construct the type key
    type_key = json_type.lower()
    if format:
        type_key = f"{type_key}:{format.lower()}"
    
    # Handle nullable types
    if nullable and not type_key.startswith("optional:"):
        type_key = f"optional:{type_key}"
    
    # Look up the type in the map
    python_type = type_map.get(type_key)
    
    # Fall back to basic type if format-specific type not found
    if python_type is None and ":" in type_key:
        basic_type = type_map.get(type_key.split(":")[0])
        if basic_type is not None:
            python_type = Optional[basic_type] if nullable else basic_type
    
    if python_type is None:
        raise ValueError(f"Unsupported type: {json_type}" + 
                       (f" with format: {format}" if format else ""))
    
    return python_type

def convert_value_to_type(value: Any, param_name: str, param_type: str, format: Optional[str] = None) -> Any:
    """
    Converts a value to the specified parameter type with optional format.
    
    Args:
        value: The value to convert
        param_name: The name of the parameter (for error messages)
        param_type: The target type to convert to
        format: Optional format specifier (e.g., 'date', 'date-time', 'uuid', etc.)
        
    Returns:
        The converted value
        
    Raises:
        ValueError: If conversion fails
    """
    try:
        # Handle null/None values
        if value is None:
            return None

        # Construct type key
        type_key = param_type.lower()
        if format:
            type_key = f"{type_key}:{format.lower()}"
            
        # String conversions
        if type_key.startswith("string"):
            if format == "date":
                if isinstance(value, str):
                    return date.fromisoformat(value)
                elif isinstance(value, datetime):
                    return value.date()
                elif isinstance(value, date):
                    return value
                
            elif format == "date-time":
                if isinstance(value, str):
                    return datetime.fromisoformat(value.replace('Z', '+00:00'))
                elif isinstance(value, datetime):
                    return value
                    
            elif format == "time":
                if isinstance(value, str):
                    return time.fromisoformat(value)
                elif isinstance(value, time):
                    return value
                    
            elif format == "uuid":
                if isinstance(value, str):
                    return UUID(value)
                elif isinstance(value, UUID):
                    return value
                    
            elif format == "email":
                email_str = str(value)
                # Basic email validation
                if not re.match(r"[^@]+@[^@]+\.[^@]+", email_str):
                    raise ValueError(f"Invalid email format: {email_str}")
                return email_str
                
            elif format == "uri" or format == "uri-reference":
                return str(value)  # Could add URI validation if needed
                
            elif format == "ipv4":
                ip_str = str(value)
                # Basic IPv4 validation
                if not re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", ip_str):
                    raise ValueError(f"Invalid IPv4 format: {ip_str}")
                return ip_str
                
            elif format == "binary":
                if isinstance(value, bytes):
                    return value
                elif isinstance(value, str):
                    return value.encode()
                    
            return str(value)

        # Number conversions
        elif type_key.startswith("number"):
            if format == "decimal":
                return Decimal(str(value))
            return float(value)

        # Integer conversions
        elif type_key.startswith("integer"):
            if isinstance(value, str):
                # Handle string numbers with decimals
                return int(float(value))
            return int(value)

        # Boolean conversions
        elif type_key == "boolean":
            if isinstance(value, str):
                return value.lower() in ("true", "1", "yes", "y", "on", "t")
            return bool(value)

        # Array conversions
        elif type_key.startswith("array"):
            # Handle string JSON arrays
            if isinstance(value, str):
                value = json.loads(value)
                
            # Convert to list if it's a tuple or other sequence
            if not isinstance(value, list):
                value = list(value)
                
            # If format specifies element type, convert all elements
            if format:
                return [convert_value_to_type(item, f"{param_name}[{i}]", format) 
                       for i, item in enumerate(value)]
            return value

        # Object conversions
        elif type_key.startswith("object"):
            # Handle string JSON objects
            if isinstance(value, str):
                value = json.loads(value)
                
            if not isinstance(value, dict):
                raise ValueError(f"Cannot convert {type(value)} to object")
                
            # If format specifies value type, convert all values
            if format:
                return {k: convert_value_to_type(v, f"{param_name}.{k}", format) 
                       for k, v in value.items()}
            return value

        # If no specific conversion needed, return as is
        return value

    except Exception as e:
        type_desc = f"{param_type}" + (f" with format {format}" if format else "")
        raise ValueError(f"Failed to convert {param_name} to {type_desc}: {str(e)}")