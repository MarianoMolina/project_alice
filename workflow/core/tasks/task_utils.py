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
            node_summary = f"Node {i} - {node.node_name} (Exit: {node.exit_code}):"
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
    Uses validate_and_process_function_inputs to handle variable resolution.
    
    Args:
        node_responses: List of node responses to summarize
        verbose: Whether to include detailed information
        output_prompt: Optional prompt template to format the output
        **kwargs: Task inputs and other variables
    """
    if not output_prompt:
        return generate_default_summary(node_responses, verbose)

    try:
        # Use validate_and_process_function_inputs to get template variables
        # Prioritize node outputs over kwargs for template formatting
        template_vars, error = validate_and_process_function_inputs(
            params=output_prompt.parameters,
            execution_history=node_responses,
            kwargs=kwargs,
            prioritize_kwargs=False  # Prioritize node outputs for templates
        )
        
        if error:
            LOGGER.warning(f"Error processing template variables: {error}")
            return generate_default_summary(node_responses, verbose)
            
        # Format the template with our collected variables
        return output_prompt.format_prompt(**template_vars)
            
    except Exception as e:
        LOGGER.error(f"Error formatting output with template: {str(e)}")
        return generate_default_summary(node_responses, verbose)

def validate_and_process_function_inputs(
    params: FunctionParameters,
    execution_history: List[NodeResponse],
    kwargs: Dict[str, Any],
    prioritize_kwargs: bool = True
) -> Tuple[Dict[str, Any], Optional[str]]:
    """
    Validates and processes input parameters against a FunctionParameters definition.
    Can prioritize either kwargs or node outputs when looking for values.
    
    Args:
        params: FunctionParameters object defining expected inputs
        execution_history: Previous execution history to check for variable values
        kwargs: Input parameters to validate and process
        prioritize_kwargs: Whether to check kwargs before node outputs (default: True)
        
    Returns:
        Tuple containing processed inputs dict and error message (if any)
    """
    def find_in_history(param_name: str) -> Optional[Any]:
        """Helper to find parameter value in execution history, prioritizing the last version."""
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
        value = None
        
        # Order of checking depends on prioritization
        sources = [
            (kwargs.get(param_name), "kwargs"),
            (find_in_history(param_name), "history")
        ]
        
        if not prioritize_kwargs:
            sources.reverse()
            
        # Check sources in order
        for val, source in sources:
            if val is not None:
                try:
                    value = convert_value_to_type(
                        value=val,
                        param_name=param_name,
                        param_type=param_def.type
                    )
                    LOGGER.debug(f"Found value for {param_name} in {source}")
                    return value, None
                except (ValueError, TypeError) as e:
                    LOGGER.warning(f"Error converting {source} value for parameter '{param_name}': {str(e)}")
                    continue

        # Use default if no valid value found
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