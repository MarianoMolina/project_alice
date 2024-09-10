import asyncio, os
from workflow_logic.core.api.engines import LLMEngine, LLMAnthropic
from workflow_logic.core.data_structures import MessageDict, LLMConfig

async def test_llm_engines():
    # LM Studio setup
    lm_studio_engine = LLMEngine()
    lm_studio_config = LLMConfig(
        api_key="lm-studio",  # LM Studio doesn't require an API key
        base_url="http://localhost:3000/lm-studio",
        model="66a81f4e540cb0193b86bb93" 
    )

    # OpenAI setup
    openai_engine = LLMEngine()
    openai_config = LLMConfig(
        api_key=os.environ.get("OPENAI_API_KEY"),
        base_url="https://api.openai.com/v1",
        model="gpt-3.5-turbo"
    )

    # Anthropic setup
    anthropic_engine = LLMAnthropic()
    anthropic_config = LLMConfig(
        api_key=os.environ.get("ANTHROPIC_API"),
        base_url="https://api.anthropic.com",
        model="claude-3-haiku-20240307"
    )

    system = "You are a helpful assistant."
    # Test messages
    messages = [
        {"role": "user", "content": "Tell me a short story about a brave knight."}
    ]

    # Additional parameters
    kwargs = {
        "system": system,
        "messages": messages,
        "max_tokens": 150,
        "temperature": 0.7,
        "n": 1
    }

    engines = [
        ("LM Studio", lm_studio_engine, lm_studio_config),
        ("OpenAI", openai_engine, openai_config),
        ("Anthropic", anthropic_engine, anthropic_config)
    ]

    for name, engine, config in engines:
        print(f"\nTesting {name} API:")
        try:
            inputs = kwargs.copy()
            response: MessageDict = await engine.generate_api_response(config, **inputs)
            print(f"Response from {name}:")
            print(f"Role: {response.role}")
            print(f"Content: {response.content}")
            print(f"\nCreation Metadata: {response.creation_metadata}")
            usage = engine.get_usage(response)
            print("\nUsage Information:")
            for key, value in usage.items():
                print(f"{key}: {value}")
        except Exception as e:
            print(f"An error occurred with {name} API: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_llm_engines())