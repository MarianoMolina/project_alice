from typing import Dict, Any, Optional, List, Tuple
from workflow.core.data_structures import (
    FunctionParameters, NodeResponse, ExecutionHistoryItem, Prompt
)
from workflow.util.utils import convert_value_to_type
from workflow.util import LOGGER

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
    output_prompt: Optional[Prompt] = None
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
            
            return output_prompt.format_prompt(**prompt_vars)
            
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
    
    Args:
        params: FunctionParameters object defining expected inputs
        execution_history: Previous execution history to check for variable values
        kwargs: Input parameters to validate and process
        
    Returns:
        Tuple containing processed inputs dict and error message (if any)
    """
    processed_inputs = kwargs.copy()

    # Check each required parameter
    for param_name in params.required:
        # Skip if already in kwargs and no matching node exists
        if param_name in processed_inputs and not any(
            node.node_name == param_name for node in execution_history
        ):
            continue

        # Look for matching node in history
        matching_node = next(
            (node for node in reversed(execution_history)
             if node.node_name == param_name and node.references),
            None
        )

        if matching_node:
            try:
                # Get value from node references
                value = matching_node.references.detailed_summary()
                param_def = params.properties[param_name]
                
                # Convert to the correct type
                processed_inputs[param_name] = convert_value_to_type(
                    value=value,
                    param_name=param_name,
                    param_type=param_def.type
                )
                LOGGER.debug(f"Using value from node {param_name} in execution history")
            except (ValueError, TypeError) as e:
                return {}, f"Error converting value for parameter '{param_name}': {str(e)}"
        
        # If still not found, check for default value
        elif param_name not in processed_inputs:
            param_def = params.properties[param_name]
            if param_def.default is not None:
                processed_inputs[param_name] = param_def.default
            else:
                return {}, f"Missing required parameter: {param_name}"

    # Validate and convert all provided inputs
    for param_name, param_value in list(processed_inputs.items()):
        if param_name in params.properties:
            param_def = params.properties[param_name]
            try:
                processed_inputs[param_name] = convert_value_to_type(
                    value=param_value,
                    param_name=param_name,
                    param_type=param_def.type
                )
            except (ValueError, TypeError) as e:
                return {}, f"Invalid value for parameter '{param_name}': {str(e)}"

    return processed_inputs, None