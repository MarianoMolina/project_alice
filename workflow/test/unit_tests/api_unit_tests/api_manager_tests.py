import pytest
from unittest.mock import Mock, AsyncMock, patch
from workflow.core.api import APIManager, API, APIEngine
from workflow.core import AliceModel, FunctionParameters, ParameterDefinition, SearchOutput, ModelConfig, ApiType, ApiName

@pytest.fixture
def sample_api():
    return API(
        api_type=ApiType.LLM_MODEL,
        api_name=ApiName.OPENAI,
        name="Test API",
        is_active=True,
        health_status="healthy",
        api_config={"api_key": "test_key"},
        default_model=AliceModel(
            short_name="TestModel",
            model_name="test-model",
            model_format="OpenChat",
            ctx_size=1000,
            model_type="chat",
            api_name=ApiName.OPENAI
        )
    )

@pytest.fixture
def api_manager():
    return APIManager()

def test_add_api(api_manager, sample_api):
    api_manager.add_api(sample_api)
    assert api_manager.get_api(ApiName.OPENAI) == sample_api

def test_get_api(api_manager, sample_api):
    api_manager.add_api(sample_api)
    assert api_manager.get_api(ApiName.OPENAI) == sample_api
    assert api_manager.get_api(ApiName.ANTHROPIC) is None

def test_get_api_by_type(api_manager, sample_api):
    api_manager.add_api(sample_api)
    assert api_manager.get_api_by_type(ApiType.LLM_MODEL) == sample_api
    assert api_manager.get_api_by_type(ApiType.GOOGLE_SEARCH) is None

def test_retrieve_api_data_llm(api_manager, sample_api):
    api_manager.add_api(sample_api)
    llm_config = api_manager.retrieve_api_data(ApiType.LLM_MODEL)
    assert isinstance(llm_config, ModelConfig)
    assert llm_config.model == 'test-model'
    assert llm_config.api_key == 'test_key'

def test_retrieve_api_data_non_llm(api_manager):
    non_llm_api = API(
        api_type=ApiType.GOOGLE_SEARCH,
        api_name=ApiName.GOOGLE_SEARCH,
        name="Google Search API",
        is_active=True,
        health_status="healthy",
        api_config={"api_key": "google_key", "cse_id": "test_cse_id"}
    )
    api_manager.add_api(non_llm_api)
    api_data = api_manager.retrieve_api_data(ApiType.GOOGLE_SEARCH)
    assert api_data == {"api_key": "google_key", "cse_id": "test_cse_id"}

def test_retrieve_api_data_no_active_api(api_manager):
    with pytest.raises(ValueError, match="No active API found for type:"):
        api_manager.retrieve_api_data(ApiType.GOOGLE_SEARCH)

@pytest.mark.asyncio
async def test_generate_response_with_api_engine_llm(api_manager, sample_api):
    api_manager.add_api(sample_api)
    
    mock_llm_engine = AsyncMock(spec=APIEngine)
    mock_response = {
        "role": "assistant",
        "content": "Test response",
        "generated_by": "llm"
    }
    mock_llm_engine.generate_api_response.return_value = mock_response
    mock_llm_engine.input_variables = FunctionParameters(
        type="object",
        properties={
            "messages": ParameterDefinition(type="array", description="The messages to process"),
            "model": ParameterDefinition(type="string", description="The model to use")
        },
        required=["messages"]
    )
    
    with patch('workflow.core.api.api_manager.get_api_engine', return_value=lambda: mock_llm_engine):
        response = await api_manager.generate_response_with_api_engine(
            api_type=ApiType.LLM_MODEL,
            model=sample_api.default_model,
            messages=[{"role": "user", "content": "Hello"}]
        )
    
    assert isinstance(response, dict), f"Expected response to be a dict, but got {type(response)}"
    assert "role" in response, "Expected 'role' in response"
    assert "content" in response, "Expected 'content' in response"
    assert "generated_by" in response, "Expected 'generated_by' in response"
    assert response["role"] == "assistant"
    assert response["content"] == "Test response"
    assert response["generated_by"] == "llm"

@pytest.mark.asyncio
async def test_generate_response_with_api_engine_search(api_manager):
    search_api = API(
        api_type=ApiType.GOOGLE_SEARCH,
        api_name=ApiName.GOOGLE_SEARCH,
        name="Google Search API",
        is_active=True,
        health_status="healthy",
        api_config={"api_key": "google_key", "cse_id": "test_cse_id"}
    )
    api_manager.add_api(search_api)
    
    mock_search_engine = AsyncMock(spec=APIEngine)
    mock_search_engine.generate_api_response.return_value = SearchOutput(
        content=[{"title": "Test Result", "url": "https://test.com", "content": "Test content"}]
    )
    mock_search_engine.input_variables = FunctionParameters(
        type="object",
        properties={
            "query": ParameterDefinition(type="string", description="The search query"),
            "num_results": ParameterDefinition(type="integer", description="Number of results to return")
        },
        required=["query"]
    )
    
    with patch('workflow.core.api.api_manager.get_api_engine', return_value=lambda: mock_search_engine):
        response = await api_manager.generate_response_with_api_engine(
            api_type=ApiType.GOOGLE_SEARCH,
            query="test query"
        )
    
    assert isinstance(response, SearchOutput)
    assert len(response.content) == 1
    assert response.content[0]["title"] == "Test Result"

@pytest.mark.asyncio
async def test_generate_response_with_api_engine_no_api(api_manager):
    with pytest.raises(ValueError, match="No API found for type:"):
        await api_manager.generate_response_with_api_engine(api_type=ApiType.LLM_MODEL)

@pytest.mark.asyncio
async def test_generate_response_with_api_engine_invalid_inputs(api_manager, sample_api):
    api_manager.add_api(sample_api)
    
    mock_llm_engine = Mock(spec=APIEngine)
    mock_llm_engine.input_variables = Mock()
    mock_llm_engine.input_variables.properties = {"messages": {"type": "array"}}
    mock_llm_engine.input_variables.required = ["messages"]
    
    with patch('workflow.core.api.api_manager.get_api_engine', return_value=lambda: mock_llm_engine):
        with pytest.raises(ValueError, match="Missing required input: messages"):
            await api_manager.generate_response_with_api_engine(
                api_type=ApiType.LLM_MODEL,
                model=sample_api.default_model
            )

if __name__ == "__main__":
    pytest.main([__file__, "-v"])