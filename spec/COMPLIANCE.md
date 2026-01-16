# PLP Compliance Guide

This document defines what it means for a server or client to be PLP-compliant.

## Server Compliance

### Minimal Compliance (REQUIRED)

A PLP-compliant server MUST implement the following:

#### 1. Required Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/prompts/{id}` | GET | Retrieve a prompt by ID |
| `/v1/prompts/{id}/{version}` | GET | Retrieve a specific version |
| `/v1/prompts/{id}` | PUT | Create or update a prompt |
| `/v1/prompts/{id}` | DELETE | Delete a prompt |

#### 2. Envelope Format

All responses MUST use the PLP Envelope format:

```json
{
  "id": "string (required)",
  "content": "string (required)",
  "meta": { } // object (required, may be empty)
}
```

#### 3. Status Codes

| Operation | Success | Not Found | Bad Request | Unauthorized |
|-----------|---------|-----------|-------------|--------------|
| GET | 200 | 404 | 400 | 401 |
| PUT (new) | 201 | - | 400 | 401 |
| PUT (update) | 200 | - | 400 | 401 |
| DELETE | 204 | 404 | 400 | 401 |

#### 4. Error Format

All errors MUST return:

```json
{
  "error": "Human-readable error message"
}
```

#### 5. Latest Version Logic

When GET is called without a version parameter, the server MUST return the latest version of the prompt.

---

### Recommended Compliance (SHOULD)

A fully-compliant server SHOULD also:

1. **Implement Discovery Endpoint**
   ```
   GET /.well-known/plp
   ```

2. **Support Versioning**
   - Store version history when `meta.version` is provided
   - Allow retrieval of specific versions

3. **Validate Prompt IDs**
   - Reject IDs with `..` (path traversal)
   - Reject IDs starting/ending with `/`
   - Reject IDs with consecutive slashes (`//`)
   - Reject IDs exceeding 256 characters

4. **Use HTTPS in Production**

5. **Implement Rate Limiting**

---

## Client Compliance

### Minimal Compliance (REQUIRED)

A PLP-compliant client MUST:

1. Support all three operations: GET, PUT, DELETE
2. Send `Content-Type: application/json` header for PUT requests
3. Handle the standard error format
4. Support optional Bearer token authentication

### Recommended Compliance (SHOULD)

A fully-compliant client SHOULD also:

1. Check the discovery endpoint before operations
2. Support version-specific retrieval
3. Handle timeout errors gracefully
4. Support custom headers

---

## Compliance Checklist

Use this checklist to verify your implementation:

### Server Checklist

- [ ] `GET /v1/prompts/{id}` returns 200 with valid envelope
- [ ] `GET /v1/prompts/{id}` returns 404 for missing prompt
- [ ] `GET /v1/prompts/{id}/{version}` returns specific version
- [ ] `GET /v1/prompts/{id}/{version}` returns 404 for missing version
- [ ] `PUT /v1/prompts/{id}` returns 201 for new prompt
- [ ] `PUT /v1/prompts/{id}` returns 200 for existing prompt
- [ ] `PUT /v1/prompts/{id}` returns 400 for missing content
- [ ] `PUT /v1/prompts/{id}` returns 400 for missing meta
- [ ] `DELETE /v1/prompts/{id}` returns 204 on success
- [ ] `DELETE /v1/prompts/{id}` returns 404 for missing prompt
- [ ] All errors return `{"error": "message"}` format
- [ ] Envelope includes `id`, `content`, and `meta` fields

### Client Checklist

- [ ] Can retrieve prompts by ID
- [ ] Can retrieve prompts by ID and version
- [ ] Can create new prompts
- [ ] Can update existing prompts
- [ ] Can delete prompts
- [ ] Sends correct Content-Type header
- [ ] Handles 404 errors appropriately
- [ ] Handles 401 errors appropriately
- [ ] Supports Bearer token authentication

---

## Compliance Testing

### How to Become Compliant

PLP uses **self-certification** - no registration or approval required:

1. **Implement the required endpoints** per the [specification](SPEC.md)
2. **Run the compliance test suite** (see below)
3. **Tests pass?** → You're compliant
4. **Display the compliance badge** in your documentation
5. **(Optional)** Add your implementation to the [registry](https://echostash.com/registry)

### Automated Testing

**Web-based tester** (recommended for quick testing):
```
https://echostash.com/compliance
```

**CLI tool** (for CI/CD pipelines):
```bash
npx @goreal-ai/plp-registry test https://your-server.com/v1
```

**What gets tested:**
- All required endpoints (GET, PUT, DELETE)
- Envelope format validation
- Error response format
- HTTP status codes
- Version handling
- ID validation

**Test results:**
- **PASS** → You're PLP-compliant, display the badge
- **FAIL** → Fix issues and re-test (unlimited retries)

### No Registration Required

Unlike some protocols, PLP compliance is:
- ✅ Self-declared (honor system)
- ✅ Free forever
- ✅ No approval process
- ✅ Instant validation
- ❌ No registration needed
- ❌ No recurring certification fees

### Manual Testing

You can manually test compliance using curl:

```bash
# Test PUT (create)
curl -X PUT https://your-server.com/v1/prompts/test/compliance \
  -H "Content-Type: application/json" \
  -d '{"content": "Test prompt", "meta": {"version": "1.0.0"}}'
# Expected: 201 with envelope

# Test GET
curl https://your-server.com/v1/prompts/test/compliance
# Expected: 200 with envelope

# Test GET with version
curl https://your-server.com/v1/prompts/test/compliance/1.0.0
# Expected: 200 with envelope

# Test DELETE
curl -X DELETE https://your-server.com/v1/prompts/test/compliance
# Expected: 204 (no content)

# Test GET after delete
curl https://your-server.com/v1/prompts/test/compliance
# Expected: 404
```

---

## Compliance Badge

Once your implementation passes the compliance tests, you may display:

```markdown
[![PLP Compliant](https://img.shields.io/badge/PLP-v1.0_Compliant-brightgreen)](https://github.com/gorealai/plp)
```

[![PLP Compliant](https://img.shields.io/badge/PLP-v1.0_Compliant-brightgreen)](https://github.com/gorealai/plp)

---

## Questions?

If you have questions about compliance, please:

1. Check the [full specification](SPEC.md)
2. Open an issue on [GitHub](https://github.com/gorealai/plp/issues)
3. Join the discussion in GitHub Discussions
