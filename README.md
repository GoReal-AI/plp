# PLP: Prompt Library Protocol

<div align="center">

**The Minimalist Standard for Prompt Interchange**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0-green.svg)](spec/SPEC.md)

[Specification](spec/SPEC.md) • [API Docs](spec/openapi.yaml) • [SDKs](#sdks) • [Community](#community)

</div>

---

## 🎯 The Problem

AI prompts are **hardcoded everywhere**:

```javascript
// ❌ Scattered across your codebase
const prompt = "You are a helpful assistant that generates marketing copy...";
await llm.complete(prompt);
```

This creates:
- **Version chaos** – Which prompt version is in production?
- **No collaboration** – Engineers and prompt experts can't work independently
- **Deployment hell** – Changing a prompt requires code deployment
- **Zero reusability** – Every app reinvents prompt management

## ✨ The Solution

**PLP** is a universal protocol that decouples prompts from code, just like APIs decouple frontends from backends.

```javascript
// ✅ Clean, versioned, traceable
import { PLPClient } from '@plp/client';

const plp = new PLPClient('https://prompts.goreal.ai');
const prompt = await plp.get('marketing/welcome-email', '1.2.0');
await llm.complete(prompt.content);
```

## 🚀 Core Principles

1. **RESTful & Simple** – Three endpoints: GET, PUT, DELETE
2. **Language Agnostic** – Works with any stack (Python, JS, Go, Rust...)
3. **Version Control Built-In** – Fetch latest or pin to specific versions
4. **Open Standard** – MIT licensed, community-driven

---

## 📖 PLP is a Protocol, Not a Product

PLP is an **open specification** - like HTTP or OAuth. Any prompt management tool can implement it, and any AI framework can consume it.

**For Prompt Library Providers:** Implement PLP and your service works with every PLP client.

**For AI Framework Developers:** Add a PLP client and your framework works with any PLP-compliant prompt library.

Learn more: [Protocol Overview](spec/OVERVIEW.md) | [Full Specification](spec/SPEC.md)

---

## 📦 Quick Start

### Using a PLP Server

```bash
# JavaScript/Node.js
npm install @plp/client

# Python
pip install plp-client
```

**JavaScript Example:**
```javascript
import { PLPClient } from '@plp/client';

const client = new PLPClient('https://your-plp-server.com', {
  apiKey: 'optional-key'
});

// Get latest version
const prompt = await client.get('product/feature-announcement');
console.log(prompt.content); // "Hello {{name}}..."

// Save a new prompt
await client.put('support/faq-response', {
  content: 'Answer: {{answer}}',
  meta: { author: 'shimon', version: '1.0.0' }
});

// Delete a prompt
await client.delete('deprecated/old-prompt');
```

**Python Example:**
```python
from plp_client import PLPClient

client = PLPClient("https://your-plp-server.com", api_key="optional-key")

# Get latest version
prompt = client.get("product/feature-announcement")
print(prompt.content)  # "Hello {{name}}..."

# Save a new prompt
client.put("support/faq-response", {
    "content": "Answer: {{answer}}",
    "meta": {"author": "shimon", "version": "1.0.0"}
})
```

### The PLP Envelope

Every prompt follows this structure:

```json
{
  "id": "marketing/welcome-email",
  "content": "Hello {{name}}, welcome to {{product}}!",
  "meta": {
    "version": "1.2.0",
    "author": "shimon",
    "description": "Sent on user signup",
    "model_config": { "temperature": 0.7 }
  }
}
```

See [Full Specification](spec/SPEC.md) for details.

---

## 🏗️ Building a PLP Server

### Option 1: Express Middleware (Node.js)

```bash
npm install @plp/express-middleware
```

```javascript
import express from 'express';
import { plpMiddleware } from '@plp/express-middleware';

const app = express();

// Add PLP endpoints with file-based storage
app.use('/v1', plpMiddleware({
  storage: './prompts-db'
}));

app.listen(3000);
// Now serving: GET/PUT/DELETE /v1/prompts/{id}
```

### Option 2: Build from Scratch

Use our [OpenAPI spec](spec/openapi.yaml) to generate server stubs:

```bash
# Generate Go server
openapi-generator generate -i spec/openapi.yaml -g go-server

# Generate Python FastAPI
openapi-generator generate -i spec/openapi.yaml -g python-fastapi
```

Or manually implement the [three endpoints](spec/SPEC.md#3-the-api-contract).

---

## 📚 SDKs

| Language | Package | Status |
|----------|---------|--------|
| JavaScript/TypeScript | [`@plp/client`](sdks/js) | ✅ Ready |
| Python | [`plp-client`](sdks/python) | ✅ Ready |
| Go | `go-plp` | 🚧 Coming Soon |
| Rust | `plp-rs` | 🚧 Coming Soon |

**Want to build an SDK?** Follow the [Implementation Guide](spec/SPEC.md#implementation-notes).

---

## 🎖️ Implementing PLP

Want to build a PLP-compliant server or client?

1. Read the [Full Specification](spec/SPEC.md)
2. Follow the [Compliance Guide](spec/COMPLIANCE.md)
3. Test your implementation
4. Add the compliance badge:

```markdown
[![PLP Compliant](https://img.shields.io/badge/PLP-v1.0_Compliant-brightgreen)](https://github.com/gorealai/plp)
```

[![PLP Compliant](https://img.shields.io/badge/PLP-v1.0_Compliant-brightgreen)](https://github.com/gorealai/plp)

---

## 🤝 Community

- **GitHub Discussions** – Ask questions, share implementations
- **Contributing** – See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines
- **Roadmap** – Check [Issues](../../issues) for planned features

Built with ❤️ by [GoReal.AI](https://goreal.ai)

---

## 📄 License

MIT © [GoReal.AI](https://goreal.ai)

See [LICENSE](LICENSE) for details.
