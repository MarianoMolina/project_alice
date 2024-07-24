from workflow_logic.util.logging_config import LOGGER
from typing import Dict, Any, List, Tuple,  Union, Optional
from pydantic import BaseModel, Field, ConfigDict
from autogen.code_utils import extract_code
from autogen.agentchat import ConversableAgent
from workflow_logic.core.communication import DatabaseTaskResponse, MessageDict, messages_to_autogen_compatible
from workflow_logic.core.parameters import ToolCall
from workflow_logic.util.utils import get_language_matching

class ChatExecutionFunctionality(BaseModel):
    """
    Manages the execution of a chat conversation, including handling of LLM responses,
    function calls, and code execution.

    This class orchestrates the interaction between an LLM agent and an execution agent,
    processing messages, handling function calls, and managing code execution within
    the context of a chat conversation.

    Attributes:
        llm_agent (ConversableAgent): The language model agent responsible for generating responses.
        execution_agent (ConversableAgent): The agent responsible for executing functions and code.
        code_execution_config (Union[bool, dict]): Configuration for code execution.
        max_recursion_depth (int): Maximum number of recursive calls allowed in a single turn.
        valid_languages (List[str]): List of programming languages supported for code execution.
        return_output_to_agent (bool): Whether to return tool/code outputs to the LLM agent.

    Methods:
        take_turn(messages: List[MessageDict]) -> Tuple[List[MessageDict], bool]:
            Processes a single turn in the conversation, generating responses and handling function calls.

        gen_turn_responses(messages: List[MessageDict]) -> List[MessageDict]:
            Generates responses for a single turn, including handling of function calls and code execution.

        handle_function_call(response: dict) -> List[MessageDict]:
            Processes function or tool calls made by the LLM agent.

        handle_potential_code_execution(response: str, step_name: Optional[str] = None) -> List[MessageDict]:
            Extracts and executes code blocks from the LLM agent's response.

        chat(initial_message: str, max_turns: int = 1) -> List[MessageDict]:
            Conducts a chat conversation for a specified number of turns.

        retrieve_code_blocks(content: str) -> List[Tuple[str, str]]:
            Extracts valid code blocks from a given content string.

    Private Methods:
        get_message_from_tool_exec(tool_response: Dict[str, Any], is_success: bool, step_name: str) -> MessageDict:
            Formats the response from a tool or function execution into a MessageDict.

    Example:
        >>> llm_agent = ConversableAgent(...)
        >>> execution_agent = ConversableAgent(...)
        >>> chat_exec = ChatExecutionFunctionality(llm_agent=llm_agent, execution_agent=execution_agent)
        >>> messages, terminated = await chat_exec.take_turn([MessageDict(role="user", content="Hello, can you help me?")])
    """

    llm_agent: ConversableAgent = Field(..., description="The LLM agent")
    execution_agent: ConversableAgent = Field(..., description="The execution agent")
    code_execution_config: Union[bool, dict] = Field(False, description="Code execution configuration")
    max_recursion_depth: int = Field(5, description="Maximum number of recursive calls allowed in a single turn")
    valid_languages: List[str] = Field(["python", "shell"], description="A list of valid languages for code execution")
    return_output_to_agent: bool = Field(True, description="Whether to return tool/code outputs to the agent")

    model_config = ConfigDict(arbitrary_types_allowed=True)

    async def take_turn(self, messages: List[MessageDict]) -> Tuple[List[MessageDict], bool]:
        is_terminated = False
        recursion_depth = 0

        while recursion_depth < self.max_recursion_depth and not is_terminated:
            new_messages = await self.gen_turn_responses(messages)

            print(f"new_messages: {new_messages}")
            if new_messages and new_messages[-1]["content"] is not None and "TERMINATE" in new_messages[-1]["content"]:
                is_terminated = True
                break

            recursion_depth += 1

        return new_messages, is_terminated
    
    async def gen_turn_responses(self, messages: List[MessageDict]) -> List[MessageDict]:
        LOGGER.info(f"Generating response for messages: {messages}")
        autogen_messages = messages_to_autogen_compatible(messages)
        chat_response = await self.llm_agent.a_generate_reply(autogen_messages)
        new_messages = []
        if not chat_response:
            LOGGER.warning("No response generated by LLM agent.")
            raise ValueError("No response generated by LLM agent.")
        LOGGER.info(f"LLM response: {chat_response}")
        
        if isinstance(chat_response, dict) and (chat_response.get("function_call") or chat_response.get("tool_calls")):
            if 'content' in chat_response and chat_response['content']:
                # new_messages.append(MessageDict(role="assistant", content=chat_response['content'], generated_by="llm", type="text"))
                LOGGER.warning(f"Unexpected content response in tool_call: {chat_response} \ntype of chat_response: {type(chat_response)}")
            function_messages = await self.handle_function_call(chat_response)
            new_messages.extend(function_messages)
            return new_messages
        # Create a message from the response
        message = None
        content = None
        if isinstance(chat_response, dict):
            message = MessageDict(**chat_response, generated_by="llm", type="text", assistant_name=self.llm_agent.name, step="chat_response")
            content = chat_response.get("content")
        if isinstance(chat_response, str):
            content = chat_response
            message = MessageDict(role="assistant", content=chat_response, generated_by="llm", type="text", assistant_name=self.llm_agent.name, step="chat_response")
        if not message:
            LOGGER.warning(f"Unexpected response format: {chat_response} \ntype of chat_response: {type(chat_response)}")
            raise ValueError(f"Unexpected response format: {chat_response} \ntype of chat_response: {type(chat_response)}")
        new_messages.append(message)

        if new_messages and new_messages[-1]["content"] is not None and "TERMINATE" in new_messages[-1]["content"]:
            LOGGER.info("Terminating chat execution due to agent request.")
            return new_messages
        
        if self.retrieve_code_blocks(content):
            code_messages = await self.handle_potential_code_execution(content)
            if code_messages:
                new_messages.extend(code_messages)
                if self.return_output_to_agent:
                    new_messages.extend(await self.gen_turn_response(messages=[messages + new_messages]))
        return new_messages

    async def handle_function_call(self, response: dict) -> List[MessageDict]:
        if not "tool_calls" in response and not "function_call" in response:
            raise ValueError("No function call found in response.")
        new_messages: List[MessageDict] = []
        LOGGER.info(f"Handling function/tool calls: {response}")
        if "tool_calls" in response and response["tool_calls"]:
            tool_type = "tool"
            new_message = MessageDict(
                    role="assistant",
                    content=f"Calling {tool_type}: {response['tool_calls']}",
                    generated_by="llm",
                    step='function_call',
                    type="text",
                    tool_calls=[ToolCall(**tool_call) for tool_call in response["tool_calls"]]
                )
            new_messages.append(new_message)
            for tool_call in response["tool_calls"]:
                function_call = tool_call["function"]
                LOGGER.info(f"Calling tool {function_call['name']} with arguments: {function_call['arguments']} \n {function_call}")
                tool_response = await self.execution_agent._a_execute_tool_call(tool_call)
                is_success = True if tool_response.get("content") else False
                tool_message = self.get_message_from_tool_exec(tool_response, is_success, step_name=function_call["name"])
                new_messages.append(tool_message)
        if "function_call" in response and response["function_call"]:
            LOGGER.info(f"Calling function {response['function_call']} with arguments: {response['function_call']['arguments']}")
            function_call = response["function_call"]
            tool_type = "function"
            new_message = MessageDict(
                role="assistant",
                content=f"Calling {tool_type} {function_call['name']} with arguments: {function_call['arguments']}. {response.get('content', '')}",
                generated_by="llm",
                step=function_call["name"],
                type="text",
                function_call=function_call
            )
            new_messages.append(new_message)
            is_success, tool_response = await self.execution_agent.a_execute_function(function_call)
            tool_message = self.get_message_from_tool_exec(tool_response, is_success, step_name=function_call["name"])
            new_messages.append(tool_message)

        LOGGER.info(f'Responses from tool/function calls: {new_messages}')
        return new_messages
        
    def get_message_from_tool_exec(self, tool_response: Dict[str, Any], is_success: bool, step_name: str) -> MessageDict:
        if is_success and isinstance(tool_response, dict) and 'content' in tool_response:
            content = tool_response['content']
            if isinstance(content, DatabaseTaskResponse):
                return MessageDict(
                    role="tool",
                    content=str(content),
                    generated_by="tool",
                    step=step_name,
                    type="TaskResponse",
                    task_responses=[content]
                )
            else:
                return MessageDict(
                    role="tool",
                    content=str(content),
                    generated_by="tool",
                    step=step_name,
                    type="text"
                )
        else:
            error_message = f"Error executing function: {tool_response}"
            return MessageDict(
                role="tool",
                content=error_message,
                generated_by="tool",
                step=tool_response["name"],
                type="text"
            )
        
        return new_messages

    async def handle_potential_code_execution(self, response: str, step_name: Optional[str] = None) -> List[MessageDict]:
        code_blocks = self.retrieve_code_blocks(response)
        if not code_blocks:
            return []

        if self.code_execution_config:
            LOGGER.info(f"Executing code blocks: {code_blocks}")
            is_success, result = await self.execution_agent.execute_code_blocks(code_blocks)
            
            if is_success:
                if isinstance(result, dict) and 'content' in result:
                    content = result['content']
                else:
                    content = result
                if isinstance(content, DatabaseTaskResponse):
                    return [MessageDict(
                        role="tool",
                        content=str(content),
                        generated_by="tool",
                        step=step_name if step_name else "code_execution",
                        type="TaskResponse",
                        task_responses=[content]
                    )]
                else:
                    return [MessageDict(
                        role="tool",
                        content=f"Code execution result: {content}",
                        generated_by="tool",
                        step=step_name if step_name else "code_execution",
                        type="text"
                    )]
            else:
                error_message = f"Error executing code: {result}"
                return [MessageDict(
                    role="tool",
                    content=error_message,
                    generated_by="tool",
                    step=step_name if step_name else "code_execution",
                    type="text"
                )]
        
        return []
        
    async def chat(self, initial_message: str, max_turns: int = 1) -> List[MessageDict]:
        messages = [MessageDict(role="user", content=initial_message)]
        
        for _ in range(max_turns):
            new_messages, is_terminated = await self.take_turn(messages)
            messages.extend(new_messages)
            
            if is_terminated:
                break
        
        return messages
    
    def retrieve_code_blocks(self, content: str) -> List[Tuple[str, str]]:
        extracted_code = extract_code(content)
        if not extracted_code:
            return []

        valid_code_blocks = []
        unsupported_languages = set()
        for lang, code in extracted_code:
            matched_language = get_language_matching(lang)
            if matched_language in self.valid_languages:
                valid_code_blocks.append((matched_language, code))
            else:
                unsupported_languages.add(lang)
        
        if unsupported_languages:
            LOGGER.warning(f"Removed code blocks with unsupported languages: {', '.join(unsupported_languages)}")
        
        return valid_code_blocks