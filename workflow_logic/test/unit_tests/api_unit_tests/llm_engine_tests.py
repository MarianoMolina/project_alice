import unittest
from unittest.mock import AsyncMock, patch, MagicMock
from workflow_logic.core.api.engines import LLMEngine
from workflow_logic.core.data_structures import MessageDict, ModelConfig

class TestLLMEngine(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.llm_engine = LLMEngine()
        self.api_data = ModelConfig(
            api_key="dummy_api_key",
            base_url="http://api.example.com",
            model="test-model"
        )
        self.messages = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Tell me a joke."}
        ]

    @patch('workflow_logic.core.api.engines.llm_api_engine.AsyncOpenAI')
    async def test_generate_api_response_success(self, mock_openai_class):
        # Create a mock client
        mock_client = AsyncMock()
        mock_openai_class.return_value = mock_client

        # Create a mock response
        mock_choice = MagicMock()
        mock_choice.message.content = "Why did the chicken cross the road?"
        mock_choice.message.role = "assistant"
        mock_choice.message.function_call = None

        mock_usage = MagicMock()
        mock_usage.total_tokens = 20
        mock_usage.prompt_tokens = 10
        mock_usage.completion_tokens = 10
        mock_usage.model_dump.return_value = {
            "total_tokens": 20,
            "prompt_tokens": 10,
            "completion_tokens": 10
        }

        mock_response = AsyncMock()
        mock_response.choices = [mock_choice]
        mock_response.usage = mock_usage
        mock_response.model_dump.return_value = {
            "id": "chatcmpl-123",
            "object": "chat.completion",
            "created": 1677652288,
            "model": "gpt-3.5-turbo-0613",
        }

        # Make the create method return our mock response
        mock_client.chat.completions.create.return_value = mock_response

        # Call the method we're testing
        response = await self.llm_engine.generate_api_response(self.api_data, messages=self.messages)

        # Assert the results
        self.assertEqual(response['role'], "assistant")
        self.assertEqual(response['content'], "Why did the chicken cross the road?")
        self.assertIn('creation_metadata', response)
        self.assertEqual(response['creation_metadata']['usage']['total_tokens'], 20)

    @patch('workflow_logic.core.api.engines.llm_api_engine.AsyncOpenAI')
    async def test_generate_api_response_failure(self, mock_openai_class):
        mock_client = AsyncMock()
        mock_openai_class.return_value = mock_client
        mock_client.chat.completions.create.side_effect = Exception("API Error")

        with self.assertRaises(Exception):
            await self.llm_engine.generate_api_response(self.api_data, messages=self.messages)

    def test_get_usage(self):
        mock_response = MessageDict(
            role="assistant",
            content="Test content",
            creation_metadata={"usage": {"total_tokens": 20, "prompt_tokens": 10, "completion_tokens": 10}}
        )

        usage = self.llm_engine.get_usage(mock_response)

        self.assertEqual(usage['total_tokens'], 20)
        self.assertEqual(usage['prompt_tokens'], 10)
        self.assertEqual(usage['completion_tokens'], 10)

if __name__ == '__main__':
    unittest.main()