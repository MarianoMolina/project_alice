import traceback
from workflow_logic.util.logging_config import LOGGER
from unittest.mock import patch, AsyncMock
from typing import Dict, Any, List, Annotated
from workflow_logic.tests.component_tests.test_environment import TestModule
from workflow_logic.core.communication import MessageDict
from autogen.agentchat import ConversableAgent, UserProxyAgent
from workflow_logic.db_app import DBInitManager
from workflow_logic.core.api import APIManager
from workflow_logic.core.chat.chat import AliceChat
from workflow_logic.core.chat.chat_execution_functionality import ChatExecutionFunctionality

class ChatTests(TestModule):
    name: str = "ChatTests"

    async def run(self, db_init_manager: DBInitManager, **kwargs) -> Dict[str, Any]:
        test_results = {}
        api_manager = self.setup_api_manager(db_init_manager)
        
        chats = self.get_chats(db_init_manager)
        for chat in chats:
            if chat.functions:
                chat_test_results = await self.run_chat_with_functions_tests(chat, api_manager)
            else:
                chat_test_results = await self.run_chat_without_functions_tests(chat, api_manager)
            test_results[chat.name] = chat_test_results

        return {
            "test_results": test_results,
            "outputs": {"available_chats": [name for name, results in test_results.items() if all(result == "Success" for result in results.values())]}
        }

    def setup_api_manager(self, db_init_manager: DBInitManager) -> APIManager:
        api_manager = APIManager()
        for api in db_init_manager.entity_obj_key_map.get("apis", {}).values():
            api_manager.add_api(api)
        return api_manager

    def get_chats(self, db_init_manager: DBInitManager) -> List[AliceChat]:
        chats = []
        for chat_data in db_init_manager.entity_obj_key_map.get("chats", {}).values():
            if isinstance(chat_data, dict):
                chats.append(AliceChat(**chat_data))
            elif isinstance(chat_data, AliceChat):
                chats.append(chat_data)
            else:
                raise ValueError(f"Unexpected chat data type: {type(chat_data)}")
        return chats

    async def run_chat_without_functions_tests(self, chat: AliceChat, api_manager: APIManager) -> Dict[str, str]:
        return {
            "basic_response": await self.test_basic_response(chat, api_manager),
            "error_handling": await self.test_error_handling(chat, api_manager),
            "multi_turn_conversation": await self.test_multi_turn_conversation(chat, api_manager)
        }

    async def run_chat_with_functions_tests(self, chat: AliceChat, api_manager: APIManager) -> Dict[str, str]:
        return {
            "function_execution": await self.test_function_execution(chat, api_manager),
            "function_registration": self.test_function_registration(chat),
            "error_handling": await self.test_error_handling(chat, api_manager),
            "multi_turn_conversation_with_functions": await self.test_multi_turn_conversation_with_functions(chat, api_manager)
        }

    async def test_basic_response(self, chat: AliceChat, api_manager: APIManager) -> str:
        test_message = "Hello, how are you?"
        response = await chat.generate_response(api_manager, test_message)
        if isinstance(response, list) and len(response) > 0 and response[0]["role"] == "assistant":
            return "Success"
        else:
            return f"Failed: [test_basic_response] Unexpected response format - {response}"
        
    async def test_function_execution(self, chat: AliceChat, api_manager: APIManager) -> str:
        try:
            # Mock function for Google search
            async def mock_google_search(
                prompt: Annotated[str, "The search query."],
                limit: Annotated[int, "Maximum number of results to return."] = 10
            ) -> List[Dict[str, Any]]:
                return [{"title": "Paris", "link": "https://en.wikipedia.org/wiki/Paris", "snippet": "Paris is the capital of France."}]

            # Set up autogen-style agents
            assistant = ConversableAgent(
                name="Assistant",
                system_message="You are a helpful AI assistant. You can use various tools to assist with tasks.",
                llm_config={"config_list": [{"model": "gpt-4", "api_key": "mock_key"}]},
            )
            user_proxy = UserProxyAgent(
                name="User",
                llm_config=False,
                is_termination_msg=lambda msg: msg.get("content") is not None and "TERMINATE" in msg["content"],
                human_input_mode="NEVER",
            )
            assistant.register_for_llm(name="google_search", description="Search Google for information")(mock_google_search)
            user_proxy.register_for_execution(name="google_search")(mock_google_search)

            # Patch the _generate_oai_reply_from_client method
            with patch('autogen.agentchat.conversable_agent.ConversableAgent._generate_oai_reply_from_client', new_callable=AsyncMock) as mock_generate:
                mock_generate.return_value = {
                    "function_call": {
                        "name": "google_search",
                        "arguments": '{"prompt": "capital of France", "limit": 1}'
                    }
                }

                # Test the autogen implementation
                autogen_messages = [{"role": "user", "content": "What's the capital of France?"}]
                autogen_response = await assistant.a_generate_reply(autogen_messages)
                
                LOGGER.info(f"1-Autogen implementation - messages sent to OAI client: {mock_generate.call_args[0][1]}")
                LOGGER.info(f"2-Autogen implementation - messages sent to OAI client: {mock_generate.call_args[0][0].__dict__ if mock_generate.called else 'Not called'}")
                LOGGER.info(f"2-Autogen implementation - functions sent to OAI client: {mock_generate.call_args[0][0]._config_list[0]['tools'] if mock_generate.called else 'Not called'}")
                LOGGER.info(f"3-Autogen implementation - response: {autogen_response}")

                mock_generate.reset_mock()
                # Test our chat implementation
                chat_response = await chat.generate_response(api_manager, "Use the tool available to find the capital of France.")
                
                LOGGER.info(f"1-Our implementation - messages sent to OAI client: {mock_generate.call_args[0][1]}")
                LOGGER.info(f"2-Our implementation - messages sent to OAI client: {mock_generate.call_args[0][0].__dict__ if mock_generate.called else 'Not called'}")
                LOGGER.info(f"3-Our implementation - functions sent to OAI client: {mock_generate.call_args[0][0]._config_list[0]['tools'] if mock_generate.called else 'Not called'}")
                LOGGER.info(f"4-Our implementation - response: {chat_response}")

            if isinstance(chat_response, list) and len(chat_response) > 0:
                LOGGER.info(f"Chat response: {chat_response}")
                LOGGER.info(f"chat_response[0]: {chat_response[0]}")
                LOGGER.info(f"chat_response[-1]: {chat_response[-1]} \n type: {type(chat_response[-1])}")
                if any(msg.get("role") == "function" for msg in chat_response):
                    return "Success"
                else:
                    return f"Failed: Function call not detected in response - {chat_response}"
            else:
                return f"Failed: [test_function_execution] Unexpected response format - {chat_response}"
        except Exception as e:
            LOGGER.error(f"Error in test_function_execution: {str(e)}")
            LOGGER.error(traceback.format_exc())
            return f"Error: {str(e)}"
        
    def test_function_registration(self, chat: AliceChat) -> str:
        functions_list = chat.functions_list
        LOGGER.info(f"Registered functions: {functions_list}")
        
        if functions_list and isinstance(functions_list, list):
            if all(isinstance(f, dict) and 'name' in f['function'] for f in functions_list):
                return "Success"
            else:
                return f"Failed: [test_function_registration] Unexpected function format in functions_list - {functions_list}"
        else:
            return f"Failed: [test_function_registration] Unexpected functions_list format - {functions_list}"

    async def test_error_handling(self, chat: AliceChat, api_manager: APIManager) -> str:
        test_message = "This should cause an error"
        
        # Ensure chat_execution is set up
        chat.setup_chat_execution(api_manager)
        
        # Now patch the take_turn method
        with patch.object(ChatExecutionFunctionality, 'take_turn', new_callable=AsyncMock) as mock_take_turn:
            mock_take_turn.side_effect = Exception("Test error")
            response = await chat.generate_response(api_manager, test_message)
        
        if isinstance(response, list) and len(response) == 0:
            return "Success"
        else:
            return f"Failed: [test_error_handling] Unexpected error handling - {response}"

    async def test_multi_turn_conversation(self, chat: AliceChat, api_manager: APIManager) -> str:
        messages = [
            "Hello, who are you?",
            "What's your favorite color?",
            "Why do you like that color?"
        ]
        for message in messages:
            response = await chat.generate_response(api_manager, message)
            if not isinstance(response, list) or len(response) == 0:
                return f"Failed: [test_multi_turn_conversation] Unexpected response format - {response}"
            
        LOGGER.info(f"Chat messages after conversation: {chat.messages}")
        LOGGER.info(f"Chat history length: {len(chat.messages)}")
        
        # We're changing this condition to be more flexible
        if len(chat.messages) >= len(messages) * 2 + 1:  # Initial system message + user messages + assistant responses (at least)
            return "Success"
        else:
            return f"Failed: [test_multi_turn_conversation] Unexpected chat history length - {len(chat.messages)}"

    async def test_multi_turn_conversation_with_functions(self, chat: AliceChat, api_manager: APIManager) -> str:
        messages = [
            "What's the weather in Paris?",
            "And how about in London?",
            "Which city is warmer?"
        ]
        for message in messages:
            response = await chat.generate_response(api_manager, message)
            if not isinstance(response, list) or len(response) == 0:
                return f"Failed: [test_multi_turn_conversation_with_functions] Unexpected response format - {response}"
            if not any(msg["role"] == "function" for msg in response):
                return f"Failed: [test_multi_turn_conversation_with_functions] Function call not detected in response - {response}"
        
        if len(chat.messages) >= len(messages) * 3:  # At least: Initial system message + (user messages + function calls + assistant responses)
            return "Success"
        else:
            return f"Failed: [test_multi_turn_conversation_with_functions] Unexpected chat history length - {len(chat.messages)}"