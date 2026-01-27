"""
Tests for PLP client
"""

import pytest
from unittest.mock import Mock, patch
from plp_client import (
    PLPClient,
    PLPError,
    PromptInput,
    PromptEnvelope,
    TextContent,
    ImageUrl,
    ImageContent,
    is_multi_modal,
    normalize_content,
    get_text_content,
)


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


# =============================================================================
# Multi-modal Content Tests
# =============================================================================


class TestMultiModalContent:
    """Tests for multi-modal content support."""

    @patch("plp_client.client.requests.Session.request")
    def test_get_multi_modal_prompt(self, mock_request, client):
        """Test getting a multi-modal prompt."""
        mock_response = Mock()
        mock_response.ok = True
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "id": "vision/test",
            "content": [
                {"type": "text", "text": "Analyze this image:"},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "https://example.com/img.png",
                        "detail": "high",
                    },
                },
            ],
            "meta": {"version": "1.0.0"},
        }
        mock_request.return_value = mock_response

        prompt = client.get("vision/test")

        assert prompt.id == "vision/test"
        assert isinstance(prompt.content, list)
        assert len(prompt.content) == 2
        assert isinstance(prompt.content[0], TextContent)
        assert prompt.content[0].text == "Analyze this image:"
        assert isinstance(prompt.content[1], ImageContent)
        assert prompt.content[1].image_url.url == "https://example.com/img.png"
        assert prompt.content[1].image_url.detail == "high"

    @patch("plp_client.client.requests.Session.request")
    def test_put_multi_modal_prompt(self, mock_request, client):
        """Test creating a multi-modal prompt."""
        mock_response = Mock()
        mock_response.ok = True
        mock_response.status_code = 201
        mock_response.json.return_value = {
            "id": "vision/new",
            "content": [
                {"type": "text", "text": "Describe this:"},
                {"type": "image_url", "image_url": {"url": "https://example.com/img.png"}},
            ],
            "meta": {"version": "1.0.0"},
        }
        mock_request.return_value = mock_response

        input_data = PromptInput(
            content=[
                TextContent(text="Describe this:"),
                ImageContent(image_url=ImageUrl(url="https://example.com/img.png")),
            ],
            meta={"version": "1.0.0"},
        )
        prompt = client.put("vision/new", input_data)

        assert prompt.id == "vision/new"
        assert isinstance(prompt.content, list)
        mock_request.assert_called_once()

        # Verify the request body
        call_args = mock_request.call_args
        body = call_args[1]["json"]
        assert isinstance(body["content"], list)
        assert body["content"][0]["type"] == "text"
        assert body["content"][1]["type"] == "image_url"


class TestHelperFunctions:
    """Tests for helper functions."""

    def test_is_multi_modal_string_content(self):
        """Test is_multi_modal returns false for string content."""
        assert is_multi_modal("Hello {{name}}") is False

    def test_is_multi_modal_text_only_array(self):
        """Test is_multi_modal returns false for text-only array content."""
        content = [
            TextContent(text="First part"),
            TextContent(text="Second part"),
        ]
        assert is_multi_modal(content) is False

    def test_is_multi_modal_with_images(self):
        """Test is_multi_modal returns true for content with images."""
        content = [
            TextContent(text="Look at this:"),
            ImageContent(image_url=ImageUrl(url="https://example.com/img.png")),
        ]
        assert is_multi_modal(content) is True

    def test_is_multi_modal_with_prompt_envelope(self):
        """Test is_multi_modal works with PromptEnvelope."""
        text_prompt = PromptEnvelope(
            id="test",
            content="Simple text",
            meta={},
        )
        assert is_multi_modal(text_prompt) is False

        multi_modal_prompt = PromptEnvelope(
            id="test",
            content=[
                TextContent(text="With image"),
                ImageContent(image_url=ImageUrl(url="https://example.com/img.png")),
            ],
            meta={},
        )
        assert is_multi_modal(multi_modal_prompt) is True

    def test_normalize_content_string(self):
        """Test normalize_content wraps string in TextContent array."""
        result = normalize_content("Hello {{name}}")
        assert len(result) == 1
        assert isinstance(result[0], TextContent)
        assert result[0].text == "Hello {{name}}"

    def test_normalize_content_array(self):
        """Test normalize_content returns array content as-is."""
        content = [
            TextContent(text="Part 1"),
            ImageContent(image_url=ImageUrl(url="https://example.com/img.png")),
        ]
        result = normalize_content(content)
        assert result is content  # Same reference

    def test_get_text_content_string(self):
        """Test get_text_content returns string content as-is."""
        assert get_text_content("Hello {{name}}") == "Hello {{name}}"

    def test_get_text_content_array(self):
        """Test get_text_content extracts and joins text from ContentPart array."""
        content = [
            TextContent(text="First"),
            ImageContent(image_url=ImageUrl(url="https://example.com/img.png")),
            TextContent(text="Second"),
        ]
        assert get_text_content(content) == "First\nSecond"

    def test_get_text_content_no_text_parts(self):
        """Test get_text_content handles array with no text parts."""
        content = [
            ImageContent(image_url=ImageUrl(url="https://example.com/img.png")),
        ]
        assert get_text_content(content) == ""


class TestContentTypes:
    """Tests for multi-modal content types."""

    def test_text_content_to_dict(self):
        """Test TextContent serialization."""
        content = TextContent(text="Hello")
        result = content.to_dict()
        assert result == {"type": "text", "text": "Hello"}

    def test_text_content_from_dict(self):
        """Test TextContent deserialization."""
        content = TextContent.from_dict({"type": "text", "text": "Hello"})
        assert content.type == "text"
        assert content.text == "Hello"

    def test_image_url_to_dict(self):
        """Test ImageUrl serialization."""
        url = ImageUrl(url="https://example.com/img.png", detail="high")
        result = url.to_dict()
        assert result == {"url": "https://example.com/img.png", "detail": "high"}

    def test_image_url_to_dict_no_detail(self):
        """Test ImageUrl serialization without detail."""
        url = ImageUrl(url="https://example.com/img.png")
        result = url.to_dict()
        assert result == {"url": "https://example.com/img.png"}

    def test_image_content_to_dict(self):
        """Test ImageContent serialization."""
        content = ImageContent(image_url=ImageUrl(url="https://example.com/img.png"))
        result = content.to_dict()
        assert result == {
            "type": "image_url",
            "image_url": {"url": "https://example.com/img.png"},
        }

    def test_image_content_from_dict(self):
        """Test ImageContent deserialization."""
        content = ImageContent.from_dict(
            {
                "type": "image_url",
                "image_url": {"url": "https://example.com/img.png", "detail": "low"},
            }
        )
        assert content.type == "image_url"
        assert content.image_url.url == "https://example.com/img.png"
        assert content.image_url.detail == "low"

    def test_prompt_envelope_multi_modal_to_dict(self):
        """Test PromptEnvelope with multi-modal content to_dict."""
        envelope = PromptEnvelope(
            id="test/prompt",
            content=[
                TextContent(text="Hello"),
                ImageContent(image_url=ImageUrl(url="https://example.com/img.png")),
            ],
            meta={"version": "1.0.0"},
        )
        result = envelope.to_dict()
        assert result == {
            "id": "test/prompt",
            "content": [
                {"type": "text", "text": "Hello"},
                {"type": "image_url", "image_url": {"url": "https://example.com/img.png"}},
            ],
            "meta": {"version": "1.0.0"},
        }

    def test_prompt_input_multi_modal_to_dict(self):
        """Test PromptInput with multi-modal content to_dict."""
        input_data = PromptInput(
            content=[
                TextContent(text="Describe:"),
                ImageContent(
                    image_url=ImageUrl(url="https://example.com/img.png", detail="auto")
                ),
            ],
            meta={"version": "1.0.0"},
        )
        result = input_data.to_dict()
        assert result == {
            "content": [
                {"type": "text", "text": "Describe:"},
                {
                    "type": "image_url",
                    "image_url": {"url": "https://example.com/img.png", "detail": "auto"},
                },
            ],
            "meta": {"version": "1.0.0"},
        }
