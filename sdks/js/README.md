# @goreal-ai/plp-client

[![PLP Compliant](https://img.shields.io/badge/PLP-Compliant-brightgreen)](https://github.com/gorealai/plp)
[![npm version](https://img.shields.io/npm/v/@goreal-ai/plp-client.svg)](https://www.npmjs.com/package/@goreal-ai/plp-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)

Official JavaScript/TypeScript client for **PLP (Prompt Library Protocol)**.

## Installation

```bash
npm install @goreal-ai/plp-client
# or
yarn add @goreal-ai/plp-client
# or
pnpm add @goreal-ai/plp-client
```

## Quick Start

```typescript
import { PLPClient } from '@goreal-ai/plp-client';

const client = new PLPClient('https://prompts.goreal.ai', {
  apiKey: 'your-api-key' // Optional
});

// Get latest version of a prompt
const prompt = await client.get('marketing/welcome-email');
console.log(prompt.content); // "Hello {{name}}..."

// Get specific version
const oldPrompt = await client.get('marketing/welcome-email', '1.0.0');

// Save a new prompt
await client.put('support/faq-bot', {
  content: 'You are a helpful FAQ bot. Answer: {{question}}',
  meta: {
    version: '1.0.0',
    author: 'yoad'
  }
});

// Delete a prompt
await client.delete('deprecated/old-prompt');
```

## API Reference

### `PLPClient`

#### Constructor

```typescript
new PLPClient(baseUrl: string, options?: PLPClientOptions)
```

**Options:**
- `apiKey?: string` - Optional Bearer token for authentication
- `headers?: Record<string, string>` - Additional HTTP headers
- `timeout?: number` - Request timeout in milliseconds (default: 10000)

#### Methods

##### `get(promptId, version?)`

Retrieve a prompt by ID and optional version.

```typescript
async get(promptId: string, version?: string): Promise<PromptEnvelope>
```

- **`promptId`**: Unique prompt identifier (e.g., `"marketing/welcome-email"`)
- **`version`**: Optional version string (e.g., `"1.2.0"`). If omitted, returns latest.

**Returns:** `PromptEnvelope`

**Throws:** `PLPError` if not found (404) or other errors

##### `put(promptId, input)`

Create or update a prompt (idempotent upsert).

```typescript
async put(promptId: string, input: PromptInput): Promise<PromptEnvelope>
```

- **`promptId`**: Unique prompt identifier
- **`input`**: Object with `content` (string, required) and `meta` (object, optional)

**Returns:** The saved `PromptEnvelope`

##### `delete(promptId)`

Delete a prompt and all its versions.

```typescript
async delete(promptId: string): Promise<void>
```

- **`promptId`**: Unique prompt identifier

**Returns:** `void` (204 No Content on success)

##### Aliases

```typescript
fetch(promptId, version?) // Alias for get()
save(promptId, input)     // Alias for put()
```

## TypeScript Types

```typescript
interface PromptEnvelope {
  id: string;
  content: string;
  meta: {
    version?: string;
    author?: string;
    description?: string;
    model_config?: Record<string, any>;
    [key: string]: any;
  };
}

interface PromptInput {
  content: string;
  meta?: Record<string, any>;
}
```

## Error Handling

```typescript
import { PLPClient, PLPError } from '@goreal-ai/plp-client';

try {
  const prompt = await client.get('missing/prompt');
} catch (error) {
  if (error instanceof PLPError) {
    console.error('Status:', error.statusCode);
    console.error('Message:', error.message);
  }
}
```

## Examples

### Using with OpenAI

```typescript
import { PLPClient } from '@goreal-ai/plp-client';
import OpenAI from 'openai';

const plp = new PLPClient('https://prompts.goreal.ai');
const openai = new OpenAI();

const prompt = await plp.get('assistant/code-reviewer');

const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: prompt.content }],
  temperature: prompt.meta.model_config?.temperature || 0.7
});
```

### Using with Anthropic

```typescript
import { PLPClient } from '@goreal-ai/plp-client';
import Anthropic from '@anthropic-ai/sdk';

const plp = new PLPClient('https://prompts.goreal.ai');
const anthropic = new Anthropic();

const prompt = await plp.get('creative/story-generator');

const message = await anthropic.messages.create({
  model: 'claude-3-opus-20240229',
  max_tokens: prompt.meta.model_config?.max_tokens || 1024,
  messages: [{ role: 'user', content: prompt.content }]
});
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test
npm test

# Lint
npm run lint
```

## License

MIT © [GoReal.AI](https://goreal.ai)

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md)

## Learn More

- [PLP Specification](../../spec/SPEC.md)
- [OpenAPI Documentation](../../spec/openapi.yaml)
- [GitHub Repository](https://github.com/gorealai/plp)
