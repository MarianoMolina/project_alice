import logging
from typing import Dict, Any, Optional, List, Tuple
from jinja2 import Template
from pydantic import BaseModel, Field
from autogen.agentchat import ConversableAgent
from autogen.code_utils import extract_code
from workflow_logic.util.utils import get_language_matching, json_to_python_type_mapping
from workflow_logic.util.task_utils import StringOutput, LLMChatOutput, ParameterDefinition, FunctionParameters, TaskResponse, MessageDict
from workflow_logic.core.agent.agent import AgentLibrary, AliceAgent
from workflow_logic.core.tasks.task import AliceTask, prompt_function_parameters
from workflow_logic.core.prompt import Prompt, TemplatedPrompt

# Define the default FunctionParameters for the default classes
messages_function_parameters = FunctionParameters(
    type="object",
    properties={
        "messages": ParameterDefinition(
            type="list",
            description="A list of message dictionaries to use as input for the task. Dicts should have a content and role key with str values.",
            default=None
        )
    },
    required=["messages"]
)
class BasicAgentTask(AliceTask):
    agent_id: AliceAgent = Field(..., description="The agent to use for the task")
    agent_library: AgentLibrary = Field(None, description="A library of agents available for task execution. It is usually added by the TaskLibrary on initialization")
    input_variables: FunctionParameters = Field(default=messages_function_parameters, description="Inputs that the agent will require in a workflow. Default is 'messages', a list of MessageDicts.")
    exit_codes: dict[int, str] = Field(default={0: "Success", 1: "Generation failed."}, description="A dictionary of exit codes for the task")
    human_input: Optional[bool] = Field(default=False, description="Whether the task requires human input")

    @property
    def agent(self) -> ConversableAgent:
        if not self.agent_library:
            print(f'Agent library not found.')
        return self.agent_id.get_autogen_agent()
    
    def run(self, messages: List[MessageDict],  **kwargs) -> TaskResponse:
        if not messages:
            return TaskResponse(
                task_name=self.task_name,
                task_description=self.task_description,
                status="failed",
                result_code=1,
                result_diagnostic="Failed to initialize messages.",
                execution_history=kwargs.get("execution_history", [])
            )
        self.update_agent_human_input()
        logging.info(f'Executing task: {self.task_name}')
        task_inputs = messages.copy()
        result, exitcode = self.generate_agent_response(messages=messages, max_rounds=1, **kwargs)
        logging.info(f"Task {self.task_name} executed with exit code: {exitcode}. Response: {result}")
        task_outputs = StringOutput(content=[result]) if isinstance(result, str) else LLMChatOutput(content=result)
        messages.append(MessageDict(content=result, role="assistant", generated_by="llm", step=self.task_name, assistant_name=self.agent_id.name))

        if exitcode in self.exit_codes:
            return TaskResponse(
                task_name=self.task_name,
                task_description=self.task_description,
                status="complete",
                result_code=exitcode,
                task_outputs=task_outputs,
                task_inputs=task_inputs,
                result_diagnostic="Task executed.",
                execution_history=kwargs.get("execution_history", [])
            )
        return TaskResponse(
            task_name=self.task_name,
            task_description=self.task_description,
            status="failed",
            result_code=exitcode,
            task_outputs=task_outputs,
            task_inputs=task_inputs,
            result_diagnostic=f"Exit code not found.",
            execution_history=kwargs.get("execution_history", [])
        )
    
    def update_agent_human_input(self) -> None:
        if self.human_input:
            self.agent.human_input_mode = "ALWAYS"
        else:
            self.agent.human_input_mode = "NEVER"
    
    def generate_agent_response(self, messages: List[dict], max_rounds: int = 1, **kwargs) -> Tuple[str, int]:
        logging.info(f"Generating response by {self.agent_id.name} from messages: {messages}")  
        self.agent.update_max_consecutive_auto_reply(max_rounds)
        result = self.agent.generate_reply(messages)
        if result:
            if isinstance(result, str):
                return result, 0
            elif isinstance(result, dict):
                return result.get("content"), 0
        return "", 1
    
class TemplatedTask(BaseModel):
    templates: Dict[str, Prompt] = Field({}, description="A dictionary of template names and their file names")

    def add_template(self, template_name: str, prompt: Prompt):
        self.templates[template_name] = prompt

    def get_prompt_template(self, template_name: str) -> Prompt:
        if template_name not in self.templates or not self.templates[template_name]:
            raise ValueError(f"Template {template_name} not found in the task templates dictionary.")
        return self.templates[template_name]
        
    def render_template(self, template_name: str, inputs: Dict[str, Any]) -> str:
        template = self.get_prompt_template(template_name)
        if not template:
            raise ValueError(f"Template {template_name} not retrieved correctly.")
        return template.format_prompt(inputs)

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

class AgentWithFunctions(PromptAgentTask):
    agent_id: AliceAgent = Field(..., description="The agent to use for the task")
    tasks: dict[str, AliceTask] = Field(..., description="A dictionary of tasks available for the agent")
    execution_agent_id: AliceAgent = Field(..., description="The agent to use for the task execution")

    @property
    def execution_agent(self) -> ConversableAgent:
        if not self.agent_library:
            print("Agent library not found.")
        return self.execution_agent_id.get_autogen_agent()
    
    def register_functions(self, functions: List[AliceTask], llm_agent: ConversableAgent, executor: ConversableAgent, execution_history: List = []) -> Tuple[ConversableAgent, ConversableAgent]:
        for task in functions:
            task_function = task.get_function(execution_history=execution_history)
            llm_agent.update_tool_signature(task_function["tool_dict"], False)
            executor.register_function(task_function["function_map"])
        return llm_agent, executor

    def generate_agent_response(self, messages: List[dict], max_rounds: int = 5, **kwargs) -> Tuple[str, int]:
        execution_history = kwargs.pop("execution_history", [])
        self.agent.update_max_consecutive_auto_reply(max_rounds)
        agent, execution_agent = self.register_functions(list(self.tasks.values()), self.agent, self.execution_agent, execution_history=execution_history)
        chat_result = execution_agent.initiate_chat(agent, message=messages[-1], clear_history=True, max_turns=5)
        if chat_result:
            return chat_result.summary, 0
        return "", 1

cv_workflow_string_template = """The user has requested the creation of a custom {% if inputs.request_cover_letter %}CV and Cover Letter{% else %}CV{% endif %}. 
Here's the available data for context, but remember to focus on tackling the CURRENT TASK:
# Job description: this is the role the user wants to apply to
{{ inputs_job_description }}
# User's history: this is all the information we have about the user's professional background
{{ inputs_user_history }}
{% if inputs_additional_details %}
# Additional details: provided by the user
{{ inputs_additional_details }}
{% endif %}
{% if outputs %}
{% if outputs_user_clarifications_task and outputs_cv_clarifications_task %}
Based on the provided data we came up with a set of clarifying questions:
{{ outputs_cv_clarifications_task }}
Here is the user input regarding our questions:
{{ outputs_user_clarifications_task }} 
{% endif %}
{% if outputs_cv_brainstorming_task %}
We spent some time brainstorming how to succeed on this task, and these are the recommendations we came up with:
{{ outputs_cv_brainstorming_task }}
{% endif %}
{% if outputs_cover_letter %}
Here is the approved cover letter we prepared:
{{ outputs_cover_letter }}
{% endif %}
{% if outputs_cv_draft %}
Here is the approved CV draft we prepared:
{{ outputs_cv_draft }}
{% endif %}
{% endif %}
{% if task_description %}
## CURRENT TASK: 
{{ task_description }}
{% endif %}"""
## Parameters for the CV Generation Workflow
cv_clarifications_parameters = FunctionParameters(
    type="object",
    properties={
        "inputs_job_description": ParameterDefinition(
            type="string",
            description="The job description for which the CV is being created.",
            default=None
            ),
        "inputs_user_history": ParameterDefinition(
            type="string",
            description="The user's history and experience.",
            default=None
            ),
        "inputs_additional_details": ParameterDefinition(
            type="string",
            description="Additional context or details provided by the user.",
            default=None
            ),
        "inputs_request_cover_letter": ParameterDefinition(
            type="boolean",
            description="Whether a cover letter is requested.",
            default=False
            ),
    },
    required=["inputs_job_description", "inputs_user_history", "inputs_additional_details", "inputs_request_cover_letter"]
)

class CVGenerationTask(PromptAgentTask):
    templates: Dict[str, Prompt] = Field({"task_template": TemplatedPrompt(name="cv_workflow_template", content=cv_workflow_string_template, parameters=cv_clarifications_parameters)}, description="A dictionary of template names and their file names. By default this task uses the 'task_template' template to structure the inputs.")
    agent_id: AliceAgent = Field(..., description="The agent to use for the task")