import pytest
from unittest.mock import Mock, AsyncMock
from workflow_logic.core.api import LLMEngine, LLMOpenAI, LLMAnthropic
from workflow_logic.core.communication import SearchResult, SearchOutput

@pytest.fixture
def mock_aiohttp_session():
    mock_session = AsyncMock()
    mock_response = AsyncMock()
    mock_response.status = 200
    mock_response.json.return_value = {
        "choices": [{"message": {"content": "Test response"}}],
        "usage": {"prompt_tokens": 10, "completion_tokens": 20, "total_tokens": 30}
    }
    mock_session.__aenter__.return_value = mock_session
    mock_session.post.return_value.__aenter__.return_value = mock_response
    return mock_session

@pytest.mark.asyncio
async def test_llm_engine_generate_api_response(monkeypatch, mock_aiohttp_session):
    monkeypatch.setattr("aiohttp.ClientSession", Mock(return_value=mock_aiohttp_session))
    
    engine = LLMEngine()
    response = await engine.generate_api_response(
        api_data={"api_key": "test_key"},
        messages=[{"role": "user", "content": "Hello"}],
        model="gpt-3.5-turbo"
    )
    
    assert isinstance(response, SearchOutput)
    assert len(response.content) == 1
    assert isinstance(response.content[0], SearchResult)
    assert response.content[0].content == "Test response"

@pytest.mark.asyncio
async def test_llm_openai_generate_api_response(monkeypatch):
    mock_openai = AsyncMock()
    mock_openai.chat.completions.create.return_value = Mock(
        choices=[Mock(message=Mock(content="OpenAI response"))],
        model="gpt-3.5-turbo",
        usage=Mock(prompt_tokens=10, completion_tokens=20, total_tokens=30)
    )
    monkeypatch.setattr("openai.AsyncOpenAI", Mock(return_value=mock_openai))
    
    engine = LLMOpenAI()
    response = await engine.generate_api_response(
        api_data={"api_key": "test_key"},
        messages=[{"role": "user", "content": "Hello"}],
        model="gpt-3.5-turbo"
    )
    
    assert isinstance(response, SearchOutput)
    assert len(response.content) == 1
    assert response.content[0].content == "OpenAI response"

@pytest.mark.asyncio
async def test_llm_anthropic_generate_api_response(monkeypatch):
    mock_anthropic = AsyncMock()
    mock_anthropic.messages.create.return_value = Mock(
        content=[Mock(text="Anthropic response")],
        model="claude-3-sonnet-20240229",
        usage=Mock(input_tokens=10, output_tokens=20)
    )
    monkeypatch.setattr("anthropic.AsyncAnthropic", Mock(return_value=mock_anthropic))
    
    engine = LLMAnthropic()
    response = await engine.generate_api_response(
        api_data={"api_key": "test_key"},
        messages=[{"role": "user", "content": "Hello"}],
        model="claude-3-sonnet-20240229"
    )
    
    assert isinstance(response, SearchOutput)
    assert len(response.content) == 1
    assert response.content[0].content == "Anthropic response"

def test_llm_openai_calculate_cost():
    engine = LLMOpenAI()
    cost = engine.calculate_cost(100, 50, "gpt-3.5-turbo")
    assert cost == pytest.approx(0.00025)  # (100 * 0.0015 + 50 * 0.002) / 1000

def test_llm_anthropic_calculate_cost():
    engine = LLMAnthropic()
    cost = engine.calculate_cost(100, 50, "claude-3-sonnet-20240229")
    assert cost == pytest.approx(0.00105)  # (100 * 0.003 + 50 * 0.015) / 1000
