import pytest
from bson import ObjectId
from workflow_logic.core import API, AliceModel, User, LLMConfig, ApiType, ApiName

@pytest.fixture
def sample_api():
    return API(
        _id=str(ObjectId()),
        api_type=ApiType.LLM_MODEL,
        api_name=ApiName.OPENAI,
        name="Test OpenAI API",
        is_active=True,
        health_status="healthy",
        api_config={
            "api_key": "test_api_key",
            "base_url": "https://api.openai.com/v1"
        },
        default_model=AliceModel(
            id="gpt-4",
            short_name="GPT-4",
            model_name="gpt-4",
            model_format="OpenChat",
            ctx_size=8192,
            model_type="chat",
            api_name=ApiName.OPENAI,
            temperature=0.7,
            use_cache=True
        )
    )

def test_api_creation(sample_api):
    assert sample_api.api_type == ApiType.LLM_MODEL
    assert sample_api.api_name == ApiName.OPENAI
    assert sample_api.name == "Test OpenAI API"
    assert sample_api.is_active == True
    assert sample_api.health_status == "healthy"
    assert sample_api.api_config["api_key"] == "test_api_key"
    assert sample_api.default_model.model_name == "gpt-4"

def test_create_llm_config(sample_api):
    llm_config = sample_api._create_llm_config()
    assert isinstance(llm_config, LLMConfig)
    assert llm_config.model == "gpt-4"
    assert llm_config.api_key == "test_api_key"
    assert llm_config.base_url == "https://api.openai.com/v1"
    assert llm_config.temperature == 0.7
    assert llm_config.use_cache == True

def test_create_llm_config_with_custom_model(sample_api):
    custom_model = AliceModel(
        _id="gpt-3.5-turbo",
        short_name="GPT-3.5",
        model_name="gpt-3.5-turbo",
        model_format="OpenChat",
        ctx_size=4096,
        model_type="chat",
        api_name=ApiName.OPENAI,
        temperature=0.5,
        use_cache=False
    )
    llm_config = sample_api._create_llm_config(custom_model)
    assert llm_config.model == "gpt-3.5-turbo"
    assert llm_config.temperature == 0.5
    assert llm_config.use_cache == False

def test_create_llm_config_no_model(sample_api):
    sample_api.default_model = None
    with pytest.raises(ValueError, match="No model specified."):
        sample_api._create_llm_config()

def test_get_api_data_llm(sample_api):
    api_data = sample_api.get_api_data()
    assert isinstance(api_data, LLMConfig)
    assert api_data.model == "gpt-4"
    assert api_data.api_key == "test_api_key"

def test_get_api_data_non_llm():
    non_llm_api = API(
        api_type=ApiType.GOOGLE_SEARCH,
        api_name=ApiName.GOOGLE_SEARCH,
        name="Google Search API",
        is_active=True,
        api_config={"api_key": "google_key", "cse_id": "test_cse_id"}
    )
    api_data = non_llm_api.get_api_data()
    assert isinstance(api_data, dict)
    assert api_data["api_key"] == "google_key"
    assert api_data["cse_id"] == "test_cse_id"

def test_get_api_data_inactive(sample_api):
    sample_api.is_active = False
    with pytest.raises(ValueError, match="API Test OpenAI API is not active."):
        sample_api.get_api_data()

def test_get_api_data_lm_studio():
    lm_studio_api = API(
        api_type=ApiType.LLM_MODEL,
        api_name=ApiName.LM_STUDIO,
        name="LM Studio API",
        is_active=True,
        api_config={
            "api_key": "lm_studio_key",
            "base_url": "http://localhost:1234/v1"
        },
        default_model=AliceModel(
            _id="local-model",
            short_name="Local Model",
            model_name="local-model",
            model_format="OpenChat",
            ctx_size=4096,
            model_type="chat",
            api_name=ApiName.LM_STUDIO,
            temperature=0.8,
            use_cache=False
        )
    )
    api_data = lm_studio_api.get_api_data()
    assert isinstance(api_data, LLMConfig)
    assert api_data.model == "local-model"
    assert api_data.api_key == "lm_studio_key"
    assert api_data.base_url == "http://localhost:1234/v1"

def test_api_with_user_info():
    user = User(id="user123", name="Test User", email="test@example.com")
    api = API(
        api_type=ApiType.LLM_MODEL,
        api_name=ApiName.OPENAI,
        name="Test API",
        created_by=user,
        updated_by=user,
    )
    assert api.created_by == user
    assert api.updated_by == user

if __name__ == "__main__":
    pytest.main([__file__, "-v"])