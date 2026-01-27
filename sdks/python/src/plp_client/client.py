"""
PLP Client Implementation
"""

from typing import Any, Dict, List, Optional, Union
from dataclasses import dataclass
import requests


# =============================================================================
# Multi-modal Content Types
# =============================================================================


@dataclass
class TextContent:
    """Text content part."""

    type: str  # Always "text"
    text: str

    def __init__(self, text: str) -> None:
        self.type = "text"
        self.text = text

    def to_dict(self) -> Dict[str, Any]:
        return {"type": self.type, "text": self.text}

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "TextContent":
        return cls(text=data["text"])


@dataclass
class ImageUrl:
    """Image URL with optional detail level."""

    url: str
    detail: Optional[str] = None  # "auto" | "low" | "high"

    def to_dict(self) -> Dict[str, Any]:
        result: Dict[str, Any] = {"url": self.url}
        if self.detail:
            result["detail"] = self.detail
        return result

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ImageUrl":
        return cls(url=data["url"], detail=data.get("detail"))


@dataclass
class ImageContent:
    """Image content part."""

    type: str  # Always "image_url"
    image_url: ImageUrl

    def __init__(self, image_url: ImageUrl) -> None:
        self.type = "image_url"
        self.image_url = image_url

    def to_dict(self) -> Dict[str, Any]:
        return {"type": self.type, "image_url": self.image_url.to_dict()}

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ImageContent":
        return cls(image_url=ImageUrl.from_dict(data["image_url"]))


# Type aliases
ContentPart = Union[TextContent, ImageContent]
PromptContent = Union[str, List[ContentPart]]


def content_part_from_dict(data: Dict[str, Any]) -> ContentPart:
    """Create a ContentPart from a dictionary."""
    if data["type"] == "text":
        return TextContent.from_dict(data)
    elif data["type"] == "image_url":
        return ImageContent.from_dict(data)
    else:
        raise ValueError(f"Unknown content part type: {data['type']}")


def content_from_dict(data: Union[str, List[Dict[str, Any]]]) -> PromptContent:
    """Create PromptContent from a dictionary or string."""
    if isinstance(data, str):
        return data
    return [content_part_from_dict(part) for part in data]


def content_to_dict(content: PromptContent) -> Union[str, List[Dict[str, Any]]]:
    """Convert PromptContent to dictionary or string."""
    if isinstance(content, str):
        return content
    return [part.to_dict() for part in content]


# =============================================================================
# Helper Functions
# =============================================================================


def is_multi_modal(prompt: Union["PromptEnvelope", PromptContent]) -> bool:
    """
    Check if a prompt has multi-modal content (images).

    Args:
        prompt: The prompt envelope or content

    Returns:
        True if content contains image parts
    """
    if isinstance(prompt, PromptEnvelope):
        content = prompt.content
    else:
        content = prompt

    if isinstance(content, str):
        return False

    return any(isinstance(part, ImageContent) or part.type == "image_url" for part in content)


def normalize_content(content: PromptContent) -> List[ContentPart]:
    """
    Normalize content to ContentPart[] format.

    Args:
        content: String or ContentPart array

    Returns:
        ContentPart[] (string is wrapped as single TextContent)
    """
    if isinstance(content, str):
        return [TextContent(text=content)]
    return content


def get_text_content(content: PromptContent) -> str:
    """
    Get text-only content from a prompt (useful for token counting).

    Args:
        content: String or ContentPart array

    Returns:
        Combined text from all text parts
    """
    if isinstance(content, str):
        return content

    text_parts = [
        part.text for part in content if isinstance(part, TextContent) or part.type == "text"
    ]
    return "\n".join(text_parts)


# =============================================================================
# Prompt Types
# =============================================================================


class PromptEnvelope:
    """Represents a PLP prompt envelope."""

    def __init__(self, id: str, content: PromptContent, meta: Dict[str, Any]) -> None:
        self.id = id
        self.content = content
        self.meta = meta

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "PromptEnvelope":
        """Create a PromptEnvelope from a dictionary."""
        return cls(
            id=data["id"],
            content=content_from_dict(data["content"]),
            meta=data.get("meta", {}),
        )

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "content": content_to_dict(self.content),
            "meta": self.meta,
        }

    def __repr__(self) -> str:
        return f"PromptEnvelope(id='{self.id}', version={self.meta.get('version', 'latest')})"


class PromptInput:
    """Input for creating/updating a prompt."""

    def __init__(self, content: PromptContent, meta: Optional[Dict[str, Any]] = None) -> None:
        self.content = content
        self.meta = meta or {}

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "content": content_to_dict(self.content),
            "meta": self.meta,
        }


class PLPError(Exception):
    """Exception raised for PLP-related errors."""

    def __init__(
        self,
        message: str,
        status_code: Optional[int] = None,
        response: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.response = response


# =============================================================================
# PLP Client
# =============================================================================


class PLPClient:
    """
    Official Python client for PLP (Prompt Library Protocol).

    Example:
        >>> client = PLPClient("https://prompts.goreal.ai", api_key="your-key")
        >>> prompt = client.get("marketing/welcome-email")
        >>> print(prompt.content)
    """

    def __init__(
        self,
        base_url: str,
        api_key: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None,
        timeout: int = 10,
    ) -> None:
        """
        Initialize PLP client.

        Args:
            base_url: Base URL of the PLP server (e.g., "https://prompts.goreal.ai")
            api_key: Optional API key for authentication
            headers: Optional additional HTTP headers
            timeout: Request timeout in seconds (default: 10)
        """
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.headers = headers or {}
        self.timeout = timeout
        self.session = requests.Session()

    def _request(
        self,
        method: str,
        path: str,
        json: Optional[Dict[str, Any]] = None,
    ) -> Any:
        """Make an HTTP request to the PLP server."""
        url = f"{self.base_url}{path}"
        headers = {
            "Content-Type": "application/json",
            **self.headers,
        }

        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        try:
            response = self.session.request(
                method=method,
                url=url,
                json=json,
                headers=headers,
                timeout=self.timeout,
            )

            # Handle 204 No Content
            if response.status_code == 204:
                return None

            data = response.json()

            if not response.ok:
                error_message = data.get("error", f"HTTP {response.status_code}")
                raise PLPError(error_message, response.status_code, data)

            return data

        except requests.exceptions.Timeout:
            raise PLPError(f"Request timeout after {self.timeout}s")
        except requests.exceptions.RequestException as e:
            raise PLPError(f"Network error: {str(e)}")
        except ValueError as e:
            raise PLPError(f"Invalid JSON response: {str(e)}")

    def get(self, prompt_id: str, version: Optional[str] = None) -> PromptEnvelope:
        """
        Retrieve a prompt by ID and optional version.

        Args:
            prompt_id: The unique prompt identifier (e.g., "marketing/welcome-email")
            version: Optional version string (e.g., "1.2.0"). If omitted, returns latest.

        Returns:
            PromptEnvelope: The prompt envelope

        Raises:
            PLPError: If the prompt is not found or other errors occur
        """
        path = (
            f"/v1/prompts/{prompt_id}/{version}"
            if version
            else f"/v1/prompts/{prompt_id}"
        )
        data = self._request("GET", path)
        return PromptEnvelope.from_dict(data)

    def put(self, prompt_id: str, input: PromptInput) -> PromptEnvelope:
        """
        Create or update a prompt (idempotent upsert).

        Args:
            prompt_id: The unique prompt identifier
            input: The prompt content and metadata

        Returns:
            PromptEnvelope: The saved prompt envelope

        Raises:
            PLPError: If the request fails
        """
        path = f"/v1/prompts/{prompt_id}"
        data = self._request("PUT", path, json=input.to_dict())
        return PromptEnvelope.from_dict(data)

    def delete(self, prompt_id: str) -> None:
        """
        Delete a prompt and all its versions.

        Args:
            prompt_id: The unique prompt identifier

        Raises:
            PLPError: If the prompt is not found or other errors occur
        """
        path = f"/v1/prompts/{prompt_id}"
        self._request("DELETE", path)

    def fetch(self, prompt_id: str, version: Optional[str] = None) -> PromptEnvelope:
        """Alias for get() - more intuitive naming."""
        return self.get(prompt_id, version)

    def save(self, prompt_id: str, input: PromptInput) -> PromptEnvelope:
        """Alias for put() - more intuitive naming."""
        return self.put(prompt_id, input)

    def __enter__(self) -> "PLPClient":
        """Context manager entry."""
        return self

    def __exit__(self, *args: Any) -> None:
        """Context manager exit."""
        self.session.close()
