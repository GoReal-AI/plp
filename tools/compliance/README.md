# @plp/compliance

Compliance test suite for PLP (Prompt Library Protocol) servers.

## Installation

```bash
npm install -g @plp/compliance
```

Or run directly with npx:

```bash
npx @plp/compliance https://your-server.com/v1
```

## Usage

### CLI

```bash
# Test a PLP server
plp-compliance https://your-server.com/v1

# With authentication
plp-compliance https://your-server.com/v1 --token YOUR_API_KEY

# JSON output (for CI/CD)
plp-compliance https://your-server.com/v1 --json

# Custom timeout (in milliseconds)
plp-compliance https://your-server.com/v1 --timeout 30000
```

### Programmatic Usage

```typescript
import { runComplianceTests, formatReport } from '@plp/compliance';

const groups = await runComplianceTests('https://your-server.com/v1', {
  authToken: 'optional-api-key',
  timeout: 10000,
});

// Generate a report
const report = formatReport('https://your-server.com/v1', groups);

console.log(`Passed: ${report.summary.passed}/${report.summary.total}`);
console.log(`Compliant: ${report.passed}`);
```

## What Gets Tested

The compliance suite validates:

### Required (MUST pass for compliance)

| Test | Description |
|------|-------------|
| PUT creates new prompt | `PUT /v1/prompts/{id}` returns 201 for new prompt |
| PUT updates existing prompt | `PUT /v1/prompts/{id}` returns 200 for existing prompt |
| PUT rejects missing content | `PUT /v1/prompts/{id}` returns 400 for missing content |
| PUT rejects missing meta | `PUT /v1/prompts/{id}` returns 400 for missing meta |
| GET retrieves prompt | `GET /v1/prompts/{id}` returns 200 with valid envelope |
| GET returns 404 for missing | `GET /v1/prompts/{id}` returns 404 for missing prompt |
| GET retrieves specific version | `GET /v1/prompts/{id}/{version}` returns specific version |
| GET returns 404 for missing version | `GET /v1/prompts/{id}/{version}` returns 404 |
| DELETE removes prompt | `DELETE /v1/prompts/{id}` returns 204 on success |
| DELETE returns 404 for missing | `DELETE /v1/prompts/{id}` returns 404 for missing |
| Envelope has required fields | Response includes `id`, `content`, and `meta` |

### Recommended (SHOULD pass)

| Test | Description |
|------|-------------|
| Discovery endpoint | `GET /.well-known/plp` returns server capabilities |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All required tests passed (compliant) |
| 1 | One or more required tests failed (not compliant) |
| 2 | Error running tests (network error, invalid URL, etc.) |

## CI/CD Integration

```yaml
# GitHub Actions example
- name: Test PLP Compliance
  run: npx @plp/compliance ${{ secrets.PLP_SERVER_URL }} --json > compliance.json

- name: Check Compliance
  run: |
    if [ $(jq '.passed' compliance.json) != "true" ]; then
      echo "Server is not PLP compliant"
      exit 1
    fi
```

## License

MIT
