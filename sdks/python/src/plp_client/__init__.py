"""
plp-client - Official Python client for PLP (Prompt Library Protocol)
"""

from .client import PLPClient, PLPError, PromptEnvelope, PromptInput

__version__ = "1.0.0"
__all__ = ["PLPClient", "PLPError", "PromptEnvelope", "PromptInput"]
