from typing import Dict, Any
from workflow_logic.tests.TestModule import TestModule
from workflow_logic.core.communication import MessageDict
from workflow_logic.api.db_app import DBInitManager
from workflow_logic.core.api import APIManager
from workflow_logic.core.chat.chat import AliceChat
from unittest.mock import patch

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
            test_result = await self.test_chat(chat, api_manager)
            test_results[chat.name] = test_result

            if test_result == "Success":
                available_chats.append(chat['name'])

        return {
            "test_results": test_results,
            "outputs": {"available_chats": available_chats}
        }

    async def test_chat(self, chat: AliceChat, api_manager: APIManager) -> str:
        try:
            # Mock the ChatExecutionFunctionality class
            with patch('workflow_logic.core.chat.chat_execution_functionality.ChatExecutionFunctionality') as MockChatExecution:
                # Configure the mock
                mock_instance = MockChatExecution.return_value
                mock_instance.take_turn.return_value = ([MessageDict(
                    role="assistant",
                    content="This is a test response.",
                    generated_by="llm",
                    type="text"
                )], False)

                # Test the chat
                test_message = "This is a test message."
                chat_response = await chat.generate_response(api_manager, test_message)

            if len(chat_response) > 0 and chat_response[0].role == "assistant":
                return "Success"
            else:
                return "Failed to generate valid response"

        except Exception as e:
            return f"Error: {str(e)}"