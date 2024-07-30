import unittest
from unittest.mock import AsyncMock, MagicMock, patch
from workflow_logic.util.communication import MessageDict
from workflow_logic.core.agent import AliceAgent
from workflow_logic.core.parameters import FunctionConfig, FunctionParameters, ParameterDefinition
from workflow_logic.core.api import APIManager, LLMConfig
from workflow_logic.core.model import AliceModel
from workflow_logic.core.tasks import AliceTask
from autogen.agentchat import ConversableAgent
from workflow_logic.core.chat.chat import AliceChat

class TestAliceChat(unittest.IsolatedAsyncioTestCase):

    def setUp(self):
        self.messages = [
            MessageDict(role="system", content="System message", generated_by="llm", type="text"),
            MessageDict(role="user", content="Hello, Alice!", generated_by="user", type="text")
        ]
        self.alice_agent = AliceAgent(
            name="Alice",
            system_message={"name": "alice_default", "content": "You are Alice, an AI personal assistant."}
        )
        self.executor_agent = AliceAgent(
            name="executor_agent",
            system_message={"name": "executor_agent", "content": "Executor Agent."},
            autogen_class="UserProxyAgent",
            code_execution_config=True,
            default_auto_reply=""
        )
        self.chat_data = {
            "_id": "60b8d29562c1f0c025ae4c89",
            "name": "Test Chat",
            "messages": self.messages,
            "alice_agent": self.alice_agent,
            "executor": self.executor_agent,
            "model_id": AliceModel(short_name="test_model", model_type="chat", model_name="test_model", model_format="OpenChat", ctx_size=1024),
            "functions": [],
            "chat_execution": None
        }

    def test_initialization(self):
        chat = AliceChat(**self.chat_data)
        self.assertEqual(chat.id, "60b8d29562c1f0c025ae4c89")
        self.assertEqual(chat.name, "Test Chat")
        self.assertEqual(chat.alice_agent, self.alice_agent)
        self.assertEqual(chat.executor, self.executor_agent)
        self.assertEqual(chat.model_id, self.chat_data["model_id"])
        self.assertIsNone(chat.chat_execution)
        self.assertEqual(
            [{k: v for k, v in msg.items() if k in ["role", "content", "generated_by", "type"]} for msg in chat.messages],
            self.messages
        )

    def test_functions_list(self):
        chat = AliceChat(**self.chat_data)
        self.assertIsNone(chat.functions_list)

        function_mock = MagicMock(spec=AliceTask)
        function_obj = FunctionConfig(
                name="test_function", 
                description="Test function", 
                parameters=FunctionParameters(
                    type="object",
                    properties={
                        "name": ParameterDefinition(type="string", description="Dummy parameter")
                    },
                    required=["name"]
                )
            )
        function_mock.get_function.return_value = {
            "tool_function": function_obj,
            "function_map": {"test_function": lambda x: x}
        }
        chat.functions = [function_mock]
        self.assertEqual(chat.functions_list, [function_obj.model_dump()])

    @patch.object(AliceChat, 'get_default_executor')
    @patch.object(AliceChat, 'get_autogen_agent')
    def test_setup_chat_execution(self, mock_get_autogen_agent, mock_get_default_executor):
        chat = AliceChat(**self.chat_data)
        api_manager = MagicMock(spec=APIManager)
        mock_get_autogen_agent.return_value = MagicMock(spec=ConversableAgent)
        mock_get_default_executor.return_value = MagicMock(spec=ConversableAgent, _code_execution_config={})
        chat.setup_chat_execution(api_manager)
        self.assertIsNotNone(chat.chat_execution)

    @patch.object(APIManager, 'retrieve_api_data')
    def test_get_autogen_agent(self, mock_retrieve_api_data):
        chat = AliceChat(**self.chat_data)
        api_manager = APIManager()
        mock_retrieve_api_data.return_value = LLMConfig(
            api_key="test_key",
            base_url="https://test.com",
            model="test_model",
            api_type="openai"
        )
        autogen_agent = chat.get_autogen_agent(api_manager)
        self.assertIsInstance(autogen_agent, ConversableAgent)

    def test_get_combined_function_map(self):
        chat = AliceChat(**self.chat_data)
        self.assertEqual(chat.get_combined_function_map(), {})

        function_mock = MagicMock(spec=AliceTask)
        function_mock.get_function.return_value = {"function_map": {"test_function": lambda x: x}}
        chat.functions = [function_mock]
        self.assertEqual(chat.get_combined_function_map(), {"test_function": function_mock.get_function()["function_map"]["test_function"]})

    @patch.object(AliceChat, 'get_combined_function_map')
    def test_get_default_executor(self, mock_get_combined_function_map):
        chat = AliceChat(**self.chat_data)
        function_map = {"test_function": lambda x: x}
        mock_get_combined_function_map.return_value = function_map
        executor = chat.get_default_executor()
        self.assertIsInstance(executor, ConversableAgent)
        self.assertEqual(executor.function_map, function_map)

if __name__ == '__main__':
    unittest.main()