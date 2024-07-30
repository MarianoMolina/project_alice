import asyncio
from workflow_logic.core.api.engines import LLMEngine
from workflow_logic.util.communication import MessageDict
from workflow_logic.core.model import LLMConfig

async def test_llm_engine():
    # Create an instance of LLMEngine
    llm_engine = LLMEngine()

    # Set up test data
    api_data: LLMConfig = LLMConfig(
        api_key="dummy_api_key",
        base_url = "http://localhost:3000/lm-studio",
        model = "66a81f4e540cb0193b86bb93"   
    )

    # Set up test messages
    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Tell me a short story about a brave knight."}
    ]

    # Additional parameters
    kwargs = {
        "messages": messages,
        "max_tokens": 150,
        "temperature": 0.7,
        "n": 1
    }

    try:
        # Call the generate_api_response method
        response: MessageDict = await llm_engine.generate_api_response(api_data, **kwargs)

        # Print the response
        print("Response received:")
        print(f"Role: {response['role']}")
        print(f"Content: {response['content']}")
        print("\nCreation Metadata:")
        for key, value in response.get('creation_metadata', {}).items():
            print(f"{key}: {value}")

        # Get and print usage information
        usage = llm_engine.get_usage(response)
        print("\nUsage Information:")
        for key, value in usage.items():
            print(f"{key}: {value}")

    except Exception as e:
        print(f"An error occurred: {str(e)}")

# Run the test
if __name__ == "__main__":
    asyncio.run(test_llm_engine())