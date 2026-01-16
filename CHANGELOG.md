# Changelog

All notable changes to the PLP (Prompt Library Protocol) standard will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-02

### Added

- Initial release of PLP specification v1.0
- Core specification document (SPEC.md)
- OpenAPI 3.0 definition
- JSON Schema for validation
- JavaScript/TypeScript SDK (`@goreal-ai/plp-client`)
- Python SDK (`plp-client`)
- Express middleware implementation (`@goreal-ai/plp-express-middleware`)
- Comprehensive documentation and examples
- MIT License
- Contributing guidelines
- GitHub workflows for CI
- Issue templates for bug reports and feature requests

### Specification

- RESTful API with three core endpoints:
  - `GET /v1/prompts/{id}/{version?}` - Retrieve prompts
  - `PUT /v1/prompts/{id}` - Create/update prompts
  - `DELETE /v1/prompts/{id}` - Delete prompts
- Universal Envelope format for prompt data
- Built-in version control support
- Optional authentication via Bearer tokens

### SDKs

- **JavaScript/TypeScript** (`@goreal-ai/plp-client`)
  - Full TypeScript support
  - Async/await API
  - Comprehensive error handling
  - Browser and Node.js compatible

- **Python** (`plp-client`)
  - Type hints support (Python 3.8+)
  - Context manager support
  - Comprehensive test suite

### Implementations

- **Express Middleware** (`@goreal-ai/plp-express-middleware`)
  - File-based storage out of the box
  - Optional authentication
  - Extensible storage interface
  - Full TypeScript support

[1.0.0]: https://github.com/gorealai/plp/releases/tag/v1.0.0
