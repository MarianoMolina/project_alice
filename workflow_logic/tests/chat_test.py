from typing import Dict, Any, List, Annotated
import traceback
from workflow_logic.tests.test_module import TestModule
from workflow_logic.core.communication import MessageDict
from workflow_logic.api.db_app import DBInitManager
from workflow_logic.core.api import APIManager
from workflow_logic.core.chat.chat import AliceChat
from workflow_logic.core.chat.chat_execution_functionality import ChatExecutionFunctionality
from unittest.mock import patch, MagicMock, AsyncMock
from autogen import ConversableAgent, UserProxyAgent

class ChatTests(TestModule):
    name: str = "ChatTests"

    async def run(self, db_init_manager: DBInitManager, **kwargs) -> Dict[str, Any]:
        test_results = {}
        available_chats = []
        api_manager = APIManager()

        # Set up API Manager
        for api in db_init_manager.entity_obj_key_map.get("apis", {}).values():
            api_manager.add_api(api)

        # Retrieve all chats from db_init_manager
        for chat in db_init_manager.entity_obj_key_map.get("chats", {}).values():
            # Test each chat
            if not isinstance(chat, AliceChat):
                if isinstance(chat, dict):
                    chat = AliceChat(**chat)
                else:
                    raise ValueError(f"Chat object is not of type AliceChat: {chat}")
            
            chat_test_results = await self.test_chat(chat, api_manager)
            test_results[chat.name] = chat_test_results

        return {
            "test_results": test_results,
            "outputs": {"available_chats": [name for name, results in test_results.items() if all(result == "Success" for result in results.values())]}
        }

    async def test_chat(self, chat: AliceChat, api_manager: APIManager) -> Dict[str, str]:
        test_results = {}
        
        # Test 1: Basic response generation
        test_results["basic_response"] = await self.test_basic_response(chat, api_manager)

        # Test 2: Function registration and execution
        test_results["function_execution"] = await self.test_function_execution(chat, api_manager)

        # Test 3: Error handling
        test_results["error_handling"] = await self.test_error_handling(chat, api_manager)

        return test_results

    async def test_basic_response(self, chat: AliceChat, api_manager: APIManager) -> str:
        try:
            with patch('workflow_logic.core.chat.chat_execution_functionality.ChatExecutionFunctionality') as MockChatExecution:
                mock_instance = MockChatExecution.return_value
                mock_instance.take_turn.return_value = ([MessageDict(
                    role="assistant",
                    content="This is a test response.",
                    generated_by="llm",
                    type="text"
                )], False)
                
                # Ensure the mock is set up as an async method
                mock_instance.take_turn.side_effect = AsyncMock(return_value=mock_instance.take_turn.return_value)

                test_message = "This is a test message."
                chat_response = await chat.generate_response(api_manager, test_message)
                print(f"chat_response: {chat_response}")

            if isinstance(chat_response, list):
                if len(chat_response) > 0:
                    if isinstance(chat_response[0], dict) and chat_response[0].get('role') == 'assistant':
                        return "Success"
                    else:
                        return f"Invalid response format. Expected 'assistant' role, got: {chat_response}"
                else:
                    return "Response list is empty"
            else:
                return f"Invalid response type. Expected list, got: {type(chat_response)}"
        except Exception as e:
            return f"Unexpected error: {str(e)} -> traceback: {traceback.format_exc()}"
                        
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

            # Create a mock ChatExecutionFunctionality
            mock_chat_execution = MagicMock(spec=ChatExecutionFunctionality)
            mock_chat_execution.llm_agent = assistant
            mock_chat_execution.execution_agent = user_proxy
            mock_chat_execution.take_turn.return_value = ([MessageDict(
                role="assistant",
                content="I'll search for information about Paris.",
                generated_by="llm",
                type="text"
            ), MessageDict(
                role="tool",
                content='{"title": "Paris", "link": "https://en.wikipedia.org/wiki/Paris", "snippet": "Paris is the capital of France."}',
                generated_by="tool",
                type="TaskResponse"
            )], False)

            # Directly set the chat_execution attribute
            chat.chat_execution = mock_chat_execution

            test_message = "Search for information about Paris"
            chat_response = await chat.generate_response(api_manager, test_message)

            if isinstance(chat_response, list) and len(chat_response) == 2:
                if all(isinstance(msg, dict) for msg in chat_response):
                    if chat_response[0].get('role') == 'assistant' and chat_response[1].get('role') == 'tool':
                        return "Success"
            return f"Failed to execute function correctly. Response: {chat_response}"
        except Exception as e:
            return f"Error in function execution test: {str(e)} -> traceback: {traceback.format_exc()}"

    async def test_error_handling(self, chat: AliceChat, api_manager: APIManager) -> str:
        try:
            with patch('workflow_logic.core.chat.chat_execution_functionality.ChatExecutionFunctionality') as MockChatExecution:
                mock_instance = MockChatExecution.return_value
                mock_instance.take_turn.side_effect = Exception("Simulated error")

                test_message = "This message should trigger an error."
                chat_response = await chat.generate_response(api_manager, test_message)

            if isinstance(chat_response, list) and len(chat_response) == 0:
                return "Success"
            else:
                return f"Failed to handle error properly. Response: {chat_response}"
        except Exception as e:
            return f"Error in error handling test: {str(e)} -> traceback: {traceback.format_exc()}"