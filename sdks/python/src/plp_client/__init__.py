"""
plp-client - Official Python client for PLP (Prompt Library Protocol)
"""

from .client import (
    PLPClient,
    PLPError,
    PromptEnvelope,
    PromptInput,
    # Multi-modal types
    TextContent,
    ImageUrl,
    ImageContent,
    ContentPart,
    PromptContent,
    # Context Store types
    ContextStoreAsset,
    AssetContent,
    StorageUsage,
    # Prompt Context types
    ContextMapping,
    ResolvedContext,
    # Helper functions
    is_multi_modal,
    normalize_content,
    get_text_content,
)

__version__ = "1.0.0"
__all__ = [
    "PLPClient",
    "PLPError",
    "PromptEnvelope",
    "PromptInput",
    # Multi-modal types
    "TextContent",
    "ImageUrl",
    "ImageContent",
    "ContentPart",
    "PromptContent",
    # Context Store types
    "ContextStoreAsset",
    "AssetContent",
    "StorageUsage",
    # Prompt Context types
    "ContextMapping",
    "ResolvedContext",
    # Helper functions
    "is_multi_modal",
    "normalize_content",
    "get_text_content",
]
