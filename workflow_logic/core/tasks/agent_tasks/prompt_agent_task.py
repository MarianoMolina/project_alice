import logging
from typing import Dict, Any, Optional, List, Tuple
from pydantic import Field
from autogen.code_utils import extract_code
from workflow_logic.util.utils import get_language_matching, json_to_python_type_mapping
from workflow_logic.core.communication import MessageDict, TaskResponse
from workflow_logic.core.parameters import FunctionParameters
from workflow_logic.core.agent.agent import AliceAgent
from workflow_logic.core.tasks.task import prompt_function_parameters
from workflow_logic.core.prompt import Prompt, TemplatedPrompt
from workflow_logic.core.tasks.templated_task import TemplatedTask
from workflow_logic.core.tasks.agent_tasks.agent_task import BasicAgentTask

class PromptAgentTask(BasicAgentTask, TemplatedTask):
    input_variables: FunctionParameters = Field(default=prompt_function_parameters, description="Inputs that the agent will require in a workflow. Default is a 'prompt' str. It should be consistent with the template")
    templates: Dict[str, Prompt] = Field({"task_template": TemplatedPrompt(name="basic_prompt", content="{{prompt}}", parameters=prompt_function_parameters)}, description="A dictionary of template names and their string prompt. By default this task uses the 'task_template' template to structure the inputs, and the basic_prompt passes the prompt input")
    prompts_to_add: Optional[Dict[str, str]] = Field(None, description="An optional dictionary of prompts to add to the task")
    
    def run(self, **kwargs) -> TaskResponse:
        messages = self.create_message_list(**kwargs)
        return super().run(messages=messages, **kwargs)
    
    def create_message_list(self, **kwargs) -> List[MessageDict]:
        template = self.get_prompt_template("task_template")
        sanitized_inputs = self.update_inputs(**kwargs)
        prompts = self.prompts_to_add if self.prompts_to_add else {}
        final_inputs = {**prompts, **sanitized_inputs}
        input_string = template.format_prompt(**final_inputs)
        messages = [MessageDict(content=input_string, role="assistant", generated_by="user", step=self.task_name)] if input_string else []
        return messages
    
    def update_inputs(self, **kwargs) -> Dict[str, Any]:
        """
        Validates and sanitizes the input parameters based on the defined input_variables.
        """
        sanitized_input = {}
        # Validate and sanitize required parameters
        for param in self.input_variables.required:
            if param not in kwargs:
                raise ValueError(f"Missing required parameter: {param}")
            value = kwargs[param]
            param_type = self.input_variables.properties[param].type
            param_type = json_to_python_type_mapping(param_type)
            if not param_type:
                raise ValueError(f"Invalid parameter type: {self.input_variables.properties[param].type}")
            if not isinstance(value, param_type):
                raise TypeError(f"Parameter '{param}' should be of type {param_type}")
            sanitized_input[param] = value
        
        # Validate and sanitize optional parameters
        for param, definition in self.input_variables.properties.items():
            if param not in sanitized_input:
                value = kwargs.get(param, definition.default)
                if value is not None:
                    param_type = definition.default
                    if param_type and not isinstance(value, eval(param_type)):
                        raise TypeError(f"Parameter '{param}' should be of type {param_type}")
                sanitized_input[param] = value
        
        return sanitized_input

class CheckTask(PromptAgentTask):
    """ A type of task where you can check if the generated output includes certain strings, and return a specific exit_code depending on it"""
    agent_id: AliceAgent = Field(..., description="The agent to use for the task")
    task_name: str = Field("check_output", description="The name of the task")
    exit_code_response_map: dict[str, int] = Field({"APPROVED": 0, "FAILED": 1}, description="A dictionary of exit codes mapped to string responses for the task. These strings should be present in the system prompt of the checking agent", examples=[{"TESTS PASSED": 0, "TESTS FAILED": 1}])

    def generate_agent_response(self, messages: List[Dict], max_rounds: int = 1, **kwargs) -> Tuple[str | int]:
        logging.info(f"Checking task by {self.agent_id.name} from messages: {messages}")
        response = super().generate_agent_response(messages, max_rounds)
        for key, value in self.exit_code_response_map.items():
            if key in response[0]:
                return response[0], value
        return response[0], 1
    
class CodeGenerationLLMTask(PromptAgentTask):
    """ A task that generates code from a prompt"""
    agent_id: AliceAgent = Field(..., description="The agent to use for the task")
    task_name: str = Field("generate_code", description="The name of the task")
    exit_codes: dict[int, str] = Field({0: "Success", 1: "Generation failed.", 2: "No code blocks in response"}, description="A dictionary of exit codes for the task")

    def generate_agent_response(self, messages: List[Dict], max_rounds: int = 1, **kwargs) -> Tuple[str | int]:
        logging.info(f"Generating code by {self.agent_id.name} from messages: {messages}")
        result = self.agent.generate_reply(messages, max_turns=max_rounds)
        if not result:
            return self.exit_codes[1], 1
        code_blocks = extract_code(result)
        if not code_blocks:
            return self.exit_codes[2], 2
        if isinstance(result, str):
            return result, 0
        elif isinstance(result, dict):
            return result.get("content"), 0
        
class CodeExecutionLLMTask(PromptAgentTask):
    """ A task that executes code extracted from a prompt, outputs or messages"""
    agent_id: AliceAgent = Field(..., description="The agent to use for the task")
    task_name: str = Field("execute_code", description="The name of the task")
    exit_codes: dict[int, str] = Field({0: "Success", 1: "Execution failed.", 2: "No code blocks in messages", 3: "Execution timed out"}, description="A dictionary of exit codes for the task")
    valid_languages: list[str] = Field(["python", "shell"], description="A list of valid languages for code execution")
    timeout: int = Field(50, description="The maximum time in seconds to wait for code execution")

    def retrieve_code_blocks(self, messages: List[Dict], **kwargs) -> tuple[List[tuple[str, str]] | str, int]:
        code_blocks = []
        for msg in messages:
            if isinstance(msg, str):
                extracted_code = extract_code(msg)
                if extracted_code:
                    code_blocks.extend(extracted_code)
            if msg["content"]:
                extracted_code = extract_code(msg["content"])
                if extracted_code:
                    code_blocks.extend(extracted_code)
        if not code_blocks:
            logging.warning("No code blocks found in messages.")
            return "No valid code blocks found. Please provide a valid python or shell code block to execute.", 2
        valid_code_blocks = []
        unsupported_languages = set()
        for lang, code in code_blocks:
            matched_language = get_language_matching(lang)
            if matched_language in self.valid_languages:
                valid_code_blocks.append((matched_language, code))
            else:
                unsupported_languages.add(lang)
        
        if unsupported_languages:
            logging.warning(f"Removed code blocks with unsupported languages: {', '.join(unsupported_languages)}")
        if not valid_code_blocks:
            logging.warning("No valid code blocks found after removing unsupported languages.")
            template = f'No valid code blocks found after removing unsupported languages. Code blocks received: {code_blocks}'
            return template, 2

        languages = set(lang for lang, _ in valid_code_blocks)
        code_tuples = []
        if len(languages) == 1:
            # Combine code blocks into a single block
            lang = languages.pop()
            combined_code = "\n\n".join(code for _, code in valid_code_blocks)
            code_tuples.append((lang, combined_code))
        else:
            # Combine code blocks for each language
            for lang in languages:
                combined_code = "\n\n".join(code for lang_, code in valid_code_blocks if lang_ == lang)
                code_tuples.append((lang, combined_code))
            
        return code_tuples, 0
    
    def generate_agent_response(self, messages: List[Dict], max_rounds: int = 1, **kwargs) -> Tuple[str, int]:
        code_blocks, exitcode = self.retrieve_code_blocks(messages=messages)
        if exitcode != 0:
            return code_blocks, exitcode
        logging.info(f"Executing by {self.agent_id.name} code blocks: {code_blocks}")

        exitcode, logs = self.agent.execute_code_blocks(code_blocks)
        exitcode2str = "execution succeeded" if exitcode == 0 else "execution failed"
        return f"exitcode: {exitcode} ({exitcode2str})\nCode output: {logs}", exitcode