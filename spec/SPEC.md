# PLP: Prompt Library Protocol (v1.0)

**The Minimalist Standard for Prompt Interchange**

---

## Conventions

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

---

## 1. Overview

**PLP (Prompt Library Protocol)** is a lightweight, RESTful specification designed to decouple AI prompts from application code. It defines:

1. **A Universal Envelope** - A standardized JSON structure for prompt data
2. **A Strict API Contract** - Three RESTful endpoints for CRUD operations
3. **A Discovery Mechanism** - Optional endpoint for capability detection

### Goals

- **Simplicity** - Easy to implement in any language or framework
- **Interoperability** - Universal format for prompt exchange
- **Version Control** - Built-in support for prompt versioning
- **Decoupling** - Separate prompt management from application logic

### Non-Goals

- Prompt execution/inference (use your own LLM client)
- Authentication/authorization (OPTIONAL, implementation-specific)
- Advanced querying/search (keep it simple)

---

## 2. The Envelope (Data Structure)

Every PLP-compliant server MUST exchange prompts using this exact JSON structure:

```json
{
  "id": "marketing/welcome-email",
  "content": "Send greeting to {{name}} for signing up to {{product}}!",
  "meta": {
    "version": "1.2.0",
    "author": "shimon",
    "description": "Sent on user signup",
    "model_config": {
      "temperature": 0.7,
      "max_tokens": 500
    }
  }
}
```

### Field Specifications

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String | REQUIRED | Unique identifier (e.g., `category/name`). MAY use `/` for namespacing. |
| `content` | String | REQUIRED | The raw prompt template. MAY include variables like `{{name}}`. |
| `meta` | Object | REQUIRED | Metadata container. MUST exist even if empty (`{}`). |
| `meta.version` | String | OPTIONAL | Semantic version (e.g., `1.2.0`). RECOMMENDED for tracking. |
| `meta.author` | String | OPTIONAL | Creator identifier. |
| `meta.description` | String | OPTIONAL | Human-readable description. |
| `meta.model_config` | Object | OPTIONAL | LLM configuration hints (temperature, max_tokens, etc.). |

### Validation Rules

1. `id` MUST be unique per server instance
2. `id` MUST NOT be empty and SHOULD use lowercase with `/` separators
3. `id` MUST NOT start or end with `/`
4. `id` MUST NOT contain consecutive slashes (`//`) or directory traversal patterns (`..`)
5. `id` SHOULD NOT exceed 256 characters
6. `content` MUST be a string (MAY be empty string if needed)
7. `meta` MUST be an object (not null, not array)
8. Unknown fields in `meta` are allowed (forward compatibility)

See [plp-schema.json](plp-schema.json) for formal JSON Schema validation.

---

## 3. The API Contract

### Base URL Pattern

```
https://{host}/v1
```

All endpoints MUST be prefixed with `/v1` for future versioning.

### Authentication (Optional)

If a server requires authentication, it SHOULD use Bearer tokens:

```http
Authorization: Bearer <API_KEY>
```

**Note:** Authentication is OPTIONAL and implementation-specific. PLP servers on internal networks or closed systems MAY omit it.

---

## 3.1. Discovery Endpoint (RECOMMENDED)

Servers SHOULD implement a discovery endpoint to advertise capabilities.

### Endpoint

```http
GET /.well-known/plp
```

**Note:** This endpoint SHOULD NOT require authentication.

### Response

```json
{
  "plp_version": "1.0",
  "server": "my-plp-server",
  "capabilities": {
    "versioning": true,
    "list": false,
    "search": false
  }
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `plp_version` | String | REQUIRED | The PLP protocol version (e.g., `"1.0"`) |
| `server` | String | OPTIONAL | Server implementation name |
| `capabilities.versioning` | Boolean | REQUIRED | Whether version history is maintained |
| `capabilities.list` | Boolean | REQUIRED | Whether listing prompts is supported |
| `capabilities.search` | Boolean | REQUIRED | Whether search is supported |

Implementations MAY add additional fields to `capabilities` for custom features.

---

## 3.2. Retrieve Prompt (GET)

Fetches a prompt by ID and optional version.

### Endpoint

```http
GET /v1/prompts/{prompt_id}
GET /v1/prompts/{prompt_id}/{version}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt_id` | Path | REQUIRED | The unique prompt identifier |
| `version` | Path | OPTIONAL | Specific version (e.g., `1.2.0`). If omitted, returns **latest**. |

### Logic

- If `{version}` is omitted: Server MUST return the **latest version** of the prompt
- If `{version}` is provided: Server MUST return that exact version or 404

### Response Codes

| Code | Description | Body |
|------|-------------|------|
| `200 OK` | Successfully retrieved | PLP Envelope JSON |
| `404 Not Found` | Prompt or version not found | `{"error": "Prompt not found"}` |
| `401 Unauthorized` | Invalid/missing API key | `{"error": "Unauthorized"}` |

### Example Request

```bash
curl -X GET https://prompts.example.com/v1/prompts/marketing/welcome-email
```

### Example Response (200 OK)

```json
{
  "id": "marketing/welcome-email",
  "content": "Hello {{name}}, welcome to {{product}}!",
  "meta": {
    "version": "1.2.0",
    "author": "shimon",
    "description": "Sent on user signup"
  }
}
```

---

## 3.3. Save Prompt (PUT)

An idempotent "Upsert" operation that creates or updates a prompt.

### Endpoint

```http
PUT /v1/prompts/{prompt_id}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt_id` | Path | REQUIRED | The unique prompt identifier |

### Request Body

MUST be a valid PLP Envelope **without** the `id` field (it comes from the URL):

```json
{
  "content": "Updated content here...",
  "meta": {
    "version": "2.0.0",
    "description": "New iteration"
  }
}
```

### Logic

1. If `{prompt_id}` does NOT exist: Create a new prompt
2. If `{prompt_id}` exists:
   - Overwrite the current content
   - Optionally, save previous version internally (implementation choice)

### Response Codes

| Code | Description | Body |
|------|-------------|------|
| `201 Created` | Successfully created new prompt | Full PLP Envelope |
| `200 OK` | Successfully updated existing prompt | Full PLP Envelope |
| `400 Bad Request` | Invalid JSON or missing required fields | `{"error": "Invalid request"}` |
| `401 Unauthorized` | Invalid/missing API key | `{"error": "Unauthorized"}` |

### Example Request

```bash
curl -X PUT https://prompts.example.com/v1/prompts/support/faq-bot \
  -H "Content-Type: application/json" \
  -d '{
    "content": "You are a helpful FAQ bot. Answer: {{question}}",
    "meta": {
      "version": "1.0.0",
      "author": "yoad"
    }
  }'
```

### Example Response (201 Created)

```json
{
  "id": "support/faq-bot",
  "content": "You are a helpful FAQ bot. Answer: {{question}}",
  "meta": {
    "version": "1.0.0",
    "author": "yoad"
  }
}
```

---

## 3.4. Delete Prompt (DELETE)

Removes a prompt and all its versions.

### Endpoint

```http
DELETE /v1/prompts/{prompt_id}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt_id` | Path | REQUIRED | The unique prompt identifier |

### Logic

- Deletes the prompt identified by `{prompt_id}`
- If versioning is implemented, SHOULD delete **all versions**
- NOT idempotent: Deleting a non-existent prompt returns 404

### Response Codes

| Code | Description | Body |
|------|-------------|------|
| `204 No Content` | Successfully deleted | (Empty body) |
| `404 Not Found` | Prompt does not exist | `{"error": "Prompt not found"}` |
| `401 Unauthorized` | Invalid/missing API key | `{"error": "Unauthorized"}` |

### Example Request

```bash
curl -X DELETE https://prompts.example.com/v1/prompts/deprecated/old-prompt
```

### Example Response (204 No Content)

```
(Empty response body)
```

---

## 4. HTTP Headers

### Required Request Headers

```http
Content-Type: application/json
```

MUST be included for PUT requests with a body.

### Optional Request Headers

```http
Authorization: Bearer <API_KEY>
```

REQUIRED if server requires authentication.

### Required Response Headers

```http
Content-Type: application/json
```

MUST be included for all responses with a body (GET, PUT, error responses).

---

## 5. Error Handling

All error responses MUST follow this format:

```json
{
  "error": "Human-readable error message"
}
```

### Standard Error Codes

| Code | Meaning | Example Use Case |
|------|---------|------------------|
| `400 Bad Request` | Invalid JSON or missing fields | Malformed request body |
| `401 Unauthorized` | Missing/invalid API key | Auth required but not provided |
| `404 Not Found` | Resource doesn't exist | Prompt ID not found |
| `500 Internal Server Error` | Server-side error | Database connection failed |

---

## 6. Versioning

### Protocol Versioning

The protocol version is indicated in the base URL path:

```
/v1/prompts/...  <- Protocol v1.0
```

Future protocol versions will use `/v2`, `/v3`, etc.

### Protocol Versioning Policy

- **Major versions** (v1 -> v2): Breaking changes only. Servers SHOULD support previous major version for at least 12 months after new version release.
- **Minor versions** (v1.0 -> v1.1): Backwards-compatible additions. These are reflected in the specification document but do not change the URL path.
- Servers MAY support multiple protocol versions simultaneously.
- Clients SHOULD check the discovery endpoint to determine server capabilities.

### Prompt Versioning

Prompt versions are stored in `meta.version` and can be fetched via:

```http
GET /v1/prompts/{prompt_id}/{version}
```

Version strings SHOULD follow [Semantic Versioning](https://semver.org/):
- Basic: `1.0.0`, `2.1.3`
- With pre-release: `1.0.0-beta`, `1.0.0-rc.1`
- With build metadata: `1.0.0+build.123`

**Implementation Note:** How servers store and manage versions is flexible:
- Simple: Overwrite on PUT (no version history)
- Advanced: Keep history and allow fetching by version

---

## 7. Extensions

PLP is designed to be extensible while maintaining backwards compatibility.

### Extending the Envelope

Implementations MAY add custom fields to the `meta` object. Unknown fields MUST be preserved by compliant servers.

```json
{
  "id": "custom/prompt",
  "content": "...",
  "meta": {
    "version": "1.0.0",
    "x-custom-field": "custom value",
    "x-analytics-id": "abc123"
  }
}
```

Custom fields SHOULD use the `x-` prefix to avoid conflicts with future spec additions.

### Extending the API

Implementations MAY add custom endpoints. Custom endpoints:
- MUST NOT conflict with the reserved `/v1/prompts/` path
- SHOULD use the `x-plp-` prefix in custom headers
- SHOULD be documented separately from the core spec

### Backwards Compatibility

When extending PLP:
- Servers MUST continue to support all REQUIRED endpoints
- Servers MUST NOT require clients to use extension features
- Clients SHOULD gracefully handle unknown fields in responses

---

## 8. Compliance

### Minimal Compliance

To be **PLP-compliant**, a server MUST:

1. Implement all 3 REQUIRED endpoints (GET, PUT, DELETE at `/v1/prompts/{id}`)
2. Accept and return the PLP Envelope format
3. Return correct HTTP status codes as specified
4. Handle the "latest version" logic for GET without version
5. Return errors in the specified format

### Recommended Compliance

A fully-compliant server SHOULD also:

1. Implement the discovery endpoint (`/.well-known/plp`)
2. Support prompt versioning
3. Validate prompt IDs according to the validation rules
4. Use HTTPS in production

### Compliance Testing

Use the official compliance test suite to verify your implementation:
- [EchoStash Compliance Tester](https://echostash.com/compliance) (coming soon)

### Compliance Badge

Compliant implementations may display:

```markdown
[![PLP Compliant](https://img.shields.io/badge/PLP-v1.0_Compliant-brightgreen)](https://github.com/gorealai/plp)
```

---

## 9. Security Considerations

1. **Input Validation:** Servers MUST validate `prompt_id` to prevent path traversal attacks
2. **Rate Limiting:** Servers SHOULD implement rate limiting to protect against abuse
3. **Authentication:** Servers SHOULD use API keys or OAuth for production deployments
4. **HTTPS:** Servers MUST use encrypted connections (HTTPS) in production
5. **Content Sanitization:** Servers SHOULD be cautious with user-generated content

---

## 10. Examples

### Full Workflow Example

```bash
# 1. Check server capabilities
curl https://prompts.example.com/.well-known/plp

# 2. Create a new prompt
curl -X PUT https://prompts.example.com/v1/prompts/blog/intro \
  -H "Content-Type: application/json" \
  -d '{"content": "Write a blog intro about {{topic}}", "meta": {}}'

# 3. Retrieve it
curl https://prompts.example.com/v1/prompts/blog/intro

# 4. Update it with version
curl -X PUT https://prompts.example.com/v1/prompts/blog/intro \
  -H "Content-Type: application/json" \
  -d '{"content": "Write a catchy intro about {{topic}}", "meta": {"version": "1.1.0"}}'

# 5. Retrieve specific version
curl https://prompts.example.com/v1/prompts/blog/intro/1.1.0

# 6. Delete it
curl -X DELETE https://prompts.example.com/v1/prompts/blog/intro
```

---

## 11. Reference Implementations

- **Express Middleware (Node.js):** [@plp/express-middleware](../implementations/express-middleware)
- **JavaScript Client:** [@plp/client](../sdks/js)
- **Python Client:** [plp-client](../sdks/python)

---

## 12. Contributing

PLP is an **open standard**. We welcome:

- Feedback on the specification
- SDK implementations in new languages
- Server implementations
- Tooling and integrations

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

---

## 13. License

This specification is licensed under [MIT License](../LICENSE).

---

**Version:** 1.0
**Last Updated:** January 2026
**Maintained by:** [GoReal.AI](https://goreal.ai)
