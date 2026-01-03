# @plp/express-middleware

[![PLP Compliant](https://img.shields.io/badge/PLP-Compliant-brightgreen)](https://github.com/gorealai/plp)
[![npm version](https://img.shields.io/npm/v/@plp/express-middleware.svg)](https://www.npmjs.com/package/@plp/express-middleware)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)

Express middleware for building **PLP (Prompt Library Protocol)** compliant servers.

## Features

- ✅ **Fully PLP-compliant** - Implements all required endpoints
- 🗄️ **File-based storage** - Simple JSON file storage out of the box
- 🔒 **Optional authentication** - Bearer token support
- 🔌 **Plug & play** - Add to existing Express apps in seconds
- 📦 **TypeScript** - Full type safety

## Installation

```bash
npm install @plp/express-middleware express
# or
yarn add @plp/express-middleware express
```

## Quick Start

```typescript
import express from 'express';
import { plpMiddleware } from '@plp/express-middleware';

const app = express();
app.use(express.json());

// Add PLP endpoints at /v1
app.use('/v1', plpMiddleware({
  storage: './prompts-db'
}));

app.listen(3000, () => {
  console.log('PLP server running on http://localhost:3000');
});
```

That's it! Your server now supports:
- `GET /v1/prompts/{id}` - Retrieve prompts
- `GET /v1/prompts/{id}/{version}` - Retrieve specific versions
- `PUT /v1/prompts/{id}` - Create/update prompts
- `DELETE /v1/prompts/{id}` - Delete prompts

## Configuration

### Basic Options

```typescript
plpMiddleware({
  storage: './prompts-db',    // Required: Path to storage directory
  apiKey: 'your-secret-key',  // Optional: Simple API key authentication
})
```

### Custom Authentication

```typescript
plpMiddleware({
  storage: './prompts-db',
  validateApiKey: async (key) => {
    // Your custom authentication logic
    const user = await db.users.findByApiKey(key);
    return user !== null;
  }
})
```

## Examples

### Minimal Server

```typescript
import express from 'express';
import { plpMiddleware } from '@plp/express-middleware';

const app = express();
app.use(express.json());

app.use('/v1', plpMiddleware({
  storage: './prompts'
}));

app.listen(3000);
```

### With Authentication

```typescript
import express from 'express';
import { plpMiddleware } from '@plp/express-middleware';

const app = express();
app.use(express.json());

app.use('/v1', plpMiddleware({
  storage: './prompts',
  apiKey: process.env.PLP_API_KEY
}));

app.listen(3000);
```

### With Custom Storage

```typescript
import express from 'express';
import { plpMiddleware, Storage, PromptEnvelope } from '@plp/express-middleware';

// Implement custom storage (e.g., PostgreSQL, MongoDB)
class CustomStorage implements Storage {
  async get(id: string, version?: string): Promise<PromptEnvelope | null> {
    // Your implementation
  }

  async put(id: string, envelope: Omit<PromptEnvelope, 'id'>): Promise<PromptEnvelope> {
    // Your implementation
  }

  async delete(id: string): Promise<boolean> {
    // Your implementation
  }
}

const app = express();
app.use(express.json());

// Use custom storage
const storage = new CustomStorage();
app.use('/v1', plpMiddleware({ storage }));

app.listen(3000);
```

### Testing Your Server

```bash
# Create a prompt
curl -X PUT http://localhost:3000/v1/prompts/test/hello \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello {{name}}!",
    "meta": {"version": "1.0.0"}
  }'

# Get the prompt
curl http://localhost:3000/v1/prompts/test/hello

# Delete the prompt
curl -X DELETE http://localhost:3000/v1/prompts/test/hello
```

## API Reference

### `plpMiddleware(options)`

Creates an Express router with PLP endpoints.

**Options:**

```typescript
interface PLPMiddlewareOptions {
  storage: string | Storage;  // Path to storage directory or custom Storage implementation
  apiKey?: string;            // Optional API key for Bearer token auth
  validateApiKey?: (key: string) => boolean | Promise<boolean>; // Custom validator
}
```

**Returns:** Express `Router`

### `Storage` Interface

Implement this interface for custom storage:

```typescript
interface Storage {
  get(id: string, version?: string): Promise<PromptEnvelope | null>;
  put(id: string, envelope: Omit<PromptEnvelope, 'id'>): Promise<PromptEnvelope>;
  delete(id: string): Promise<boolean>;
}
```

### `PromptEnvelope` Type

```typescript
interface PromptEnvelope {
  id: string;
  content: string;
  meta: Record<string, any>;
}
```

## File Storage

By default, prompts are stored as JSON files:

```
./prompts-db/
  marketing__welcome-email.json           # Latest version
  marketing__welcome-email@1.0.0.json     # Versioned copy
  support__faq-bot.json
```

File naming:
- `/` in IDs are replaced with `__`
- Versioned files include `@version` suffix

## Deployment

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

### Environment Variables

```bash
PORT=3000
PLP_API_KEY=your-secret-key
STORAGE_PATH=./prompts-db
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
- [Client SDKs](../../sdks/)
- [GitHub Repository](https://github.com/gorealai/plp)
