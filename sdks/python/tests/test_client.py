"""
Tests for PLP client
"""

import pytest
from unittest.mock import Mock, patch
from plp_client import PLPClient, PLPError, PromptInput


@pytest.fixture
def client():
    """Create a test client."""
    return PLPClient("https://prompts.example.com")


@pytest.fixture
def mock_response():
    """Create a mock response object."""
    mock = Mock()
    mock.ok = True
    mock.status_code = 200
    return mock


def test_client_initialization():
    """Test client initialization."""
    client = PLPClient("https://prompts.example.com", api_key="test-key")
    assert client.base_url == "https://prompts.example.com"
    assert client.api_key == "test-key"
    assert client.timeout == 10


def test_client_initialization_strips_trailing_slash():
    """Test that trailing slash is removed from base_url."""
    client = PLPClient("https://prompts.example.com/")
    assert client.base_url == "https://prompts.example.com"


@patch("plp_client.client.requests.Session.request")
def test_get_prompt(mock_request, client):
    """Test getting a prompt."""
    mock_response = Mock()
    mock_response.ok = True
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "id": "test/prompt",
        "content": "Hello {{name}}",
        "meta": {"version": "1.0.0"},
    }
    mock_request.return_value = mock_response

    prompt = client.get("test/prompt")

    assert prompt.id == "test/prompt"
    assert prompt.content == "Hello {{name}}"
    assert prompt.meta["version"] == "1.0.0"
    mock_request.assert_called_once()


@patch("plp_client.client.requests.Session.request")
def test_get_prompt_with_version(mock_request, client):
    """Test getting a prompt with specific version."""
    mock_response = Mock()
    mock_response.ok = True
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "id": "test/prompt",
        "content": "Hello {{name}}",
        "meta": {"version": "1.0.0"},
    }
    mock_request.return_value = mock_response

    prompt = client.get("test/prompt", "1.0.0")

    assert prompt.id == "test/prompt"
    # Verify the version was included in the URL
    call_args = mock_request.call_args
    assert "/v1/prompts/test/prompt/1.0.0" in call_args[1]["url"]


@patch("plp_client.client.requests.Session.request")
def test_put_prompt(mock_request, client):
    """Test creating/updating a prompt."""
    mock_response = Mock()
    mock_response.ok = True
    mock_response.status_code = 201
    mock_response.json.return_value = {
        "id": "test/new",
        "content": "New prompt",
        "meta": {"version": "1.0.0"},
    }
    mock_request.return_value = mock_response

    input_data = PromptInput(content="New prompt", meta={"version": "1.0.0"})
    prompt = client.put("test/new", input_data)

    assert prompt.id == "test/new"
    assert prompt.content == "New prompt"
    mock_request.assert_called_once()


@patch("plp_client.client.requests.Session.request")
def test_delete_prompt(mock_request, client):
    """Test deleting a prompt."""
    mock_response = Mock()
    mock_response.ok = True
    mock_response.status_code = 204
    mock_request.return_value = mock_response

    client.delete("test/old")

    mock_request.assert_called_once()
    call_args = mock_request.call_args
    assert call_args[1]["method"] == "DELETE"


@patch("plp_client.client.requests.Session.request")
def test_error_handling_404(mock_request, client):
    """Test error handling for 404."""
    mock_response = Mock()
    mock_response.ok = False
    mock_response.status_code = 404
    mock_response.json.return_value = {"error": "Prompt not found"}
    mock_request.return_value = mock_response

    with pytest.raises(PLPError) as exc_info:
        client.get("missing/prompt")

    assert "Prompt not found" in str(exc_info.value)
    assert exc_info.value.status_code == 404


@patch("plp_client.client.requests.Session.request")
def test_authentication_header(mock_request):
    """Test that authentication header is included."""
    client = PLPClient("https://prompts.example.com", api_key="test-key-123")

    mock_response = Mock()
    mock_response.ok = True
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "id": "test/prompt",
        "content": "Test",
        "meta": {},
    }
    mock_request.return_value = mock_response

    client.get("test/prompt")

    call_args = mock_request.call_args
    headers = call_args[1]["headers"]
    assert "Authorization" in headers
    assert headers["Authorization"] == "Bearer test-key-123"


def test_context_manager(client):
    """Test using client as context manager."""
    with client as c:
        assert c is client


def test_prompt_input_to_dict():
    """Test PromptInput serialization."""
    input_data = PromptInput(
        content="Test content", meta={"version": "1.0.0", "author": "test"}
    )
    result = input_data.to_dict()

    assert result["content"] == "Test content"
    assert result["meta"]["version"] == "1.0.0"
    assert result["meta"]["author"] == "test"
