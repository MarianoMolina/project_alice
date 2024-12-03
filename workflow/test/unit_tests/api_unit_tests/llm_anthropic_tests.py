import unittest
from unittest.mock import AsyncMock, patch
from workflow.core.api.engines import LLMAnthropic
from workflow.core.data_structures import ModelConfig, ToolFunction, FunctionConfig, FunctionParameters, ParameterDefinition, MessageGenerators
from anthropic.types import Message, TextBlock, Usage

class TestLLMAnthropic(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.llm_anthropic = LLMAnthropic()
        self.api_data = ModelConfig(
            api_key="dummy_api_key",
            base_url="https://api.anthropic.com",
            model="claude-3-opus-20240229"
        )
        self.messages = [
            {"role": MessageGenerators.USER, "content": "Tell me a joke."}
        ]

    @patch('workflow.core.api.engines.anthopic_api_engine.AsyncAnthropic')
    async def test_generate_api_response_success(self, mock_anthropic_class):
        mock_client = AsyncMock()
        mock_anthropic_class.return_value = mock_client
        mock_response = Message(
            id="msg_123",
            type="message",
            role="assistant",
            content=[TextBlock(type="text", text="Why did the AI cross the road?")],
            model="claude-3-opus-20240229",
            stop_reason="end_turn",
            usage=Usage(input_tokens=10, output_tokens=10)
        )
        mock_client.messages.create.return_value = mock_response

        response = await self.llm_anthropic.generate_api_response(self.api_data, messages=self.messages)

        self.assertEqual(response['role'], "assistant")
        self.assertEqual(response['content'], "Why did the AI cross the road?")
        self.assertIn('creation_metadata', response)
        self.assertEqual(response['creation_metadata']['usage']['input_tokens'], 10)
        self.assertEqual(response['creation_metadata']['usage']['output_tokens'], 10)

    @patch('workflow.core.api.engines.anthopic_api_engine.AsyncAnthropic')
    async def test_generate_api_response_failure(self, mock_anthropic_class):
        mock_client = AsyncMock()
        mock_anthropic_class.return_value = mock_client
        mock_client.messages.create.side_effect = Exception("API Error")

        with self.assertRaises(Exception):
            await self.llm_anthropic.generate_api_response(self.api_data, messages=self.messages)

    def test_calculate_cost(self):
        input_tokens = 1000
        output_tokens = 1000
        model = "claude-3-opus-20240229"

        cost = self.llm_anthropic.calculate_cost(input_tokens, output_tokens, model)

        expected_cost = (1000 / 1000) * 0.015 + (1000 / 1000) * 0.075
        self.assertAlmostEqual(cost, expected_cost, places=6)

    def test_convert_into_tool_params(self):
        tool_functions = [
            ToolFunction(
                type="function",
                function=FunctionConfig(
                    name="get_weather",
                    description="Get the weather for a location",
                    parameters=FunctionParameters(
                        type="object",
                        properties={
                            "location": ParameterDefinition(type="string", description="The city and state, e.g. San Francisco, CA"),
                            "unit": ParameterDefinition(type="string", description="The unit of temperature")
                        },
                        required=["location"]
                    )
                )
            )
        ]

        tool_params = self.llm_anthropic._convert_into_tool_params(tool_functions)
        self.assertEqual(len(tool_params), 1)
        self.assertEqual(tool_params[0]["name"], "get_weather")
        self.assertEqual(tool_params[0]["description"], "Get the weather for a location")
        self.assertEqual(tool_params[0]["input_schema"]["type"], "object")
        self.assertEqual(tool_params[0]["input_schema"]["required"], ["location"])
        self.assertEqual(len(tool_params[0]["input_schema"]["properties"]), 2)
        self.assertEqual(tool_params[0]["input_schema"]["properties"]["unit"]["type"], "string")
        self.assertEqual(tool_params[0]["input_schema"]["properties"]["unit"]["description"], "The unit of temperature")

if __name__ == '__main__':
    unittest.main()