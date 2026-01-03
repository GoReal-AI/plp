# plp-client

[![PLP Compliant](https://img.shields.io/badge/PLP-Compliant-brightgreen)](https://github.com/gorealai/plp)
[![PyPI version](https://img.shields.io/pypi/v/plp-client.svg)](https://pypi.org/project/plp-client/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)

Official Python client for **PLP (Prompt Library Protocol)**.

## Installation

```bash
pip install plp-client
```

## Quick Start

```python
from plp_client import PLPClient, PromptInput

# Initialize client
client = PLPClient("https://prompts.goreal.ai", api_key="your-api-key")

# Get latest version of a prompt
prompt = client.get("marketing/welcome-email")
print(prompt.content)  # "Hello {{name}}..."

# Get specific version
old_prompt = client.get("marketing/welcome-email", "1.0.0")

# Save a new prompt
client.put("support/faq-bot", PromptInput(
    content="You are a helpful FAQ bot. Answer: {{question}}",
    meta={"version": "1.0.0", "author": "yoad"}
))

# Delete a prompt
client.delete("deprecated/old-prompt")
```

## API Reference

### `PLPClient`

#### Constructor

```python
PLPClient(base_url: str, api_key: Optional[str] = None, 
          headers: Optional[Dict[str, str]] = None, timeout: int = 10)
```

**Parameters:**
- `base_url` (str): Base URL of the PLP server
- `api_key` (str, optional): Optional Bearer token for authentication
- `headers` (dict, optional): Additional HTTP headers
- `timeout` (int): Request timeout in seconds (default: 10)

#### Methods

##### `get(prompt_id, version=None)`

Retrieve a prompt by ID and optional version.

```python
def get(prompt_id: str, version: Optional[str] = None) -> PromptEnvelope
```

- **`prompt_id`** (str): Unique prompt identifier (e.g., `"marketing/welcome-email"`)
- **`version`** (str, optional): Optional version string (e.g., `"1.2.0"`). If omitted, returns latest.

**Returns:** `PromptEnvelope`

**Raises:** `PLPError` if not found (404) or other errors

##### `put(prompt_id, input)`

Create or update a prompt (idempotent upsert).

```python
def put(prompt_id: str, input: PromptInput) -> PromptEnvelope
```

- **`prompt_id`** (str): Unique prompt identifier
- **`input`** (PromptInput): Object with `content` and optional `meta`

**Returns:** The saved `PromptEnvelope`

##### `delete(prompt_id)`

Delete a prompt and all its versions.

```python
def delete(prompt_id: str) -> None
```

- **`prompt_id`** (str): Unique prompt identifier

**Returns:** `None` (204 No Content on success)

##### Aliases

```python
fetch(prompt_id, version=None)  # Alias for get()
save(prompt_id, input)          # Alias for put()
```

### Data Classes

#### `PromptEnvelope`

```python
class PromptEnvelope:
    id: str
    content: str
    meta: Dict[str, Any]
```

#### `PromptInput`

```python
class PromptInput:
    content: str
    meta: Dict[str, Any]
```

## Error Handling

```python
from plp_client import PLPClient, PLPError

client = PLPClient("https://prompts.goreal.ai")

try:
    prompt = client.get("missing/prompt")
except PLPError as e:
    print(f"Error: {e}")
    print(f"Status code: {e.status_code}")
```

## Examples

### Using with OpenAI

```python
from plp_client import PLPClient
from openai import OpenAI

plp = PLPClient("https://prompts.goreal.ai")
openai = OpenAI()

prompt = plp.get("assistant/code-reviewer")

response = openai.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": prompt.content}],
    temperature=prompt.meta.get("model_config", {}).get("temperature", 0.7)
)

print(response.choices[0].message.content)
```

### Using with Anthropic

```python
from plp_client import PLPClient
import anthropic

plp = PLPClient("https://prompts.goreal.ai")
client = anthropic.Anthropic()

prompt = plp.get("creative/story-generator")

message = client.messages.create(
    model="claude-3-opus-20240229",
    max_tokens=prompt.meta.get("model_config", {}).get("max_tokens", 1024),
    messages=[{"role": "user", "content": prompt.content}]
)

print(message.content)
```

### Context Manager

```python
from plp_client import PLPClient

with PLPClient("https://prompts.goreal.ai") as client:
    prompt = client.get("my/prompt")
    print(prompt.content)
# Session is automatically closed
```

## Development

```bash
# Install dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Run tests with coverage
pytest --cov=plp_client

# Format code
black src/ tests/

# Type checking
mypy src/
```

## License

MIT © [GoReal.AI](https://goreal.ai)

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md)

## Learn More

- [PLP Specification](../../spec/SPEC.md)
- [OpenAPI Documentation](../../spec/openapi.yaml)
- [GitHub Repository](https://github.com/gorealai/plp)
