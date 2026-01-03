# Protocol Overview

PLP (Prompt Library Protocol) is an open specification for prompt interchange between AI applications and prompt management systems.

## Architecture

PLP defines a standardized REST API contract that decouples prompt storage from application logic, enabling:

- Centralized prompt management across distributed systems
- Version control and rollback capabilities
- Cross-platform prompt sharing
- Vendor-agnostic prompt libraries

## Design

The protocol consists of three components:

### 1. Data Format (Envelope)

A standardized JSON structure for prompt representation:

```json
{
  "id": "string",
  "content": "string",
  "meta": { }
}
```

All metadata is contained in the extensible `meta` object, allowing custom implementations while maintaining compatibility.

### 2. API Contract

Three RESTful endpoints for CRUD operations:

- `GET /v1/prompts/{id}[/{version}]` - Retrieve prompts
- `PUT /v1/prompts/{id}` - Create or update prompts
- `DELETE /v1/prompts/{id}` - Delete prompts

### 3. Discovery Mechanism (Optional)

`GET /.well-known/plp` returns server capabilities, enabling runtime feature detection.

## Implementation Targets

### Server-Side

Prompt management systems, databases, or storage backends implement the PLP server specification to expose their prompt libraries via a standard API.

**Target implementers:**
- Prompt management platforms (LangSmith, Promptable, etc.)
- Internal enterprise prompt repositories
- Cloud storage providers
- Version control systems

### Client-Side

AI frameworks and applications implement PLP clients to consume prompts from any compliant server.

**Target implementers:**
- AI frameworks (LangChain, LlamaIndex, Semantic Kernel)
- LLM orchestration libraries
- Application developers
- CLI tooling

## Compliance

A PLP-compliant implementation MUST:

1. Implement all three required endpoints
2. Accept and return the specified envelope format
3. Return correct HTTP status codes
4. Support version-less GET (returns latest)
5. Use the standardized error format

See [COMPLIANCE.md](COMPLIANCE.md) for detailed requirements.

## Versioning Strategy

- **Protocol versions** use URL path versioning (`/v1`, `/v2`)
- **Prompt versions** use semantic versioning in `meta.version`
- **Specification versions** follow semantic versioning

Breaking changes require a major version bump and 12-month backward compatibility support window.

## Extension Model

The protocol supports extensions through:

- Additional fields in the `meta` object (preserved by compliant servers)
- Custom endpoints outside `/v1/prompts/` namespace
- Optional capabilities advertised via discovery endpoint

Extensions MUST NOT break compatibility with the core specification.

## Security Model

Authentication and authorization are implementation-specific. The specification recommends:

- Bearer token authentication for production deployments
- HTTPS for all network communication
- Input validation to prevent path traversal attacks
- Rate limiting for public endpoints

## Resources

- [Full Specification](SPEC.md) - Detailed protocol specification
- [Compliance Guide](COMPLIANCE.md) - Implementation requirements
- [OpenAPI Definition](openapi.yaml) - Machine-readable API contract
- [Reference Implementations](../implementations/) - Example server implementations
