from typing import Dict, Any, Optional, List, Tuple
from workflow.core.data_structures import (
    FunctionParameters, NodeResponse, ExecutionHistoryItem, Prompt, ParameterDefinition
)
from workflow.util import convert_value_to_type, LOGGER

def simplify_execution_history(execution_history: List[NodeResponse]) -> List[ExecutionHistoryItem]:
    """
    Returns a simplified list of execution history items from a list of node responses.
    """
    return [ExecutionHistoryItem(
        parent_task_id=node.parent_task_id,
        node_name=node.node_name,
        execution_order=node.execution_order,
        exit_code=node.exit_code
    ) for node in execution_history]

def generate_default_summary(node_responses: List[NodeResponse], verbose: bool = False) -> str:
    """Generate default summary format for node responses."""
    sorted_nodes = sorted(node_responses, key=lambda x: x.execution_order)
    
    if verbose:
        summaries = []
        for i, node in enumerate(sorted_nodes, 1):
            node_summary = f"Node {i} (Order: {node.execution_order}, Name: {node.node_name}, Exit: {node.exit_code}):"
            references_summary = node.references.detailed_summary() if node.references else "No references"
            node_summary += f"\n    {references_summary}"
            summaries.append(node_summary)
        return "\n\n".join(summaries)
    else:
        summaries = []
        for node in sorted_nodes:
            references_summary = node.references.summary() if node.references else "No refs"
            summaries.append(f"{node.node_name}({node.execution_order}):{references_summary}")
        return "\n\n".join(summaries)
    
def generate_node_responses_summary(
    node_responses: List[NodeResponse], 
    verbose: bool = False,
    output_prompt: Optional[Prompt] = None,
    **kwargs: Any
) -> str:
    """
    Generate a summary of node responses, optionally using a template.
    
    Args:
        node_responses: List of node responses to summarize
        verbose: Whether to include detailed information
        output_prompt: Optional prompt template to format the output
        
    Returns:
        Formatted summary string
    """
    if output_prompt:
        try:
            # Extract variables from node responses
            prompt_vars = {}
            for param_name in output_prompt.input_variables:
                matching_node = next(
                    (node for node in reversed(node_responses)
                     if node.node_name == param_name and node.references),
                    None
                )
                if matching_node:
                    value = matching_node.references.detailed_summary()
                    prompt_vars[param_name] = value
                elif param_name in output_prompt.parameters.properties:
                    param_def = output_prompt.parameters.properties[param_name]
                    if param_def.default is not None:
                        prompt_vars[param_name] = param_def.default
                    else:
                        LOGGER.warning(f"Missing required parameter {param_name} for output template")
                        return generate_default_summary(node_responses, verbose)
            kwargs.pop('api_manager', None)
            kwargs.pop('execution_history', None)
            kwargs.update(prompt_vars)
            return output_prompt.format_prompt(**kwargs)
            
        except Exception as e:
            LOGGER.error(f"Error formatting output with template: {str(e)}")
            return generate_default_summary(node_responses, verbose)
    
    return generate_default_summary(node_responses, verbose)

def validate_and_process_function_inputs(
    params: FunctionParameters,
    execution_history: List[NodeResponse],
    kwargs: Dict[str, Any]
) -> Tuple[Dict[str, Any], Optional[str]]:
    """
    Validates and processes input parameters against a FunctionParameters definition.
    For each parameter defined in FunctionParameters, checks if:
    1. Value exists in kwargs
    2. If not in kwargs, looks for matching node name in execution history
    3. If not found in history, uses default value if available
    4. For required parameters, returns error if no value is found
    
    Args:
        params: FunctionParameters object defining expected inputs
        execution_history: Previous execution history to check for variable values
        kwargs: Input parameters to validate and process
        
    Returns:
        Tuple containing processed inputs dict and error message (if any)
    """
    def find_in_history(param_name: str) -> Optional[Any]:
        """Helper to find parameter value in execution history."""
        matching_node = next(
            (node for node in reversed(execution_history)
             if node.node_name == param_name and node.references),
            None
        )
        if matching_node:
            return matching_node.references.detailed_summary()
        return None

    def process_parameter(param_name: str, param_def: ParameterDefinition) -> Tuple[Optional[Any], Optional[str]]:
        """Helper to process a single parameter and return (value, error)."""
        # Check kwargs first
        if param_name in kwargs:
            try:
                return convert_value_to_type(
                    value=kwargs[param_name],
                    param_name=param_name,
                    param_type=param_def.type
                ), None
            except (ValueError, TypeError) as e:
                return None, f"Invalid value for parameter '{param_name}': {str(e)}"

        # Look in history if not in kwargs
        history_value = find_in_history(param_name)
        if history_value is not None:
            try:
                return convert_value_to_type(
                    value=history_value,
                    param_name=param_name,
                    param_type=param_def.type
                ), None
            except (ValueError, TypeError) as e:
                return None, f"Error converting history value for parameter '{param_name}': {str(e)}"

        # Use default if available
        if param_def.default is not None:
            return param_def.default, None

        # If required and we got here, it's missing
        if param_name in params.required:
            return None, f"Missing required parameter: {param_name}"

        # Optional parameter with no value found
        return None, None

    # Process all defined parameters
    processed_inputs = {}
    for param_name, param_def in params.properties.items():
        value, error = process_parameter(param_name, param_def)
        if error:
            return {}, error
        if value is not None:
            processed_inputs[param_name] = value

    return processed_inputs, None