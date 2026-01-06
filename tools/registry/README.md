# plp-registry

PLP Registry CLI for managing your PLP server listing on [plp.pub](https://plp.pub).

- **Compliance Testing** - Verify your PLP server implementation
- **Registry Management** - Register, activate, and manage your listing
- **Credential Storage** - Secure local configuration

## Installation

```bash
npm install -g plp-registry
```

Or use directly with npx:

```bash
npx plp-registry <command>
```

## Quick Start

### 1. Test Your Server

Before registering, verify your PLP server is compliant:

```bash
plp test https://api.example.com/v1
```

### 2. Install (Register with plp.pub)

Get your installation hash from [plp.pub](https://plp.pub) and run:

```bash
plp install <hash> --vendor-name "Your Company"
```

### 3. Activate Your Server

Connect your PLP server to the registry:

```bash
plp activate https://api.example.com/v1
```

For servers requiring authentication:

```bash
plp activate https://api.example.com/v1 --api-key YOUR_API_KEY
```

### 4. Generate Login Token (for Web Dashboard)

After activation, generate a temporary login token to access the web dashboard:

```bash
plp login
```

This returns a 1-hour session token for the web UI at plp.pub.

### 5. Manage Your Listing

Update your listing details using the CLI:

```bash
# Update vendor name
plp update-name "New Company Name"

# Update description
plp update-description "Our amazing PLP service"

# Set visibility
plp set-visibility public
```

## Commands

### `test <url>`

Run compliance tests against a PLP server.

```bash
plp test https://api.example.com/v1 [options]
```

**Options:**
- `-t, --token <token>` - Bearer token for authentication
- `--timeout <ms>` - Request timeout (default: 10000)
- `--debug` - Enable debug mode (show full request/response details)
- `--json` - Output as JSON
- `--no-color` - Disable colored output

**Exit codes:**
- `0` - All required tests passed
- `1` - One or more required tests failed
- `2` - Error running tests

### `install <hash>`

Complete installation with plp.pub registry.

```bash
plp install <hash> --vendor-name "Your Company" [options]
```

**Options:**
- `--vendor-name <name>` - Your vendor/organization name (required)
- `--vendor-slug <slug>` - Custom slug (auto-generated if not provided)
- `--email <email>` - Contact email
- `--debug` - Enable debug mode (show full request/response details)
- `--json` - Output as JSON
- `--config <path>` - Custom config file path

### `activate <serverUrl>`

Activate your PLP server with the registry.

```bash
plp activate https://api.example.com/v1 [options]
```

**Options:**
- `--api-key <key>` - API key for authenticating with your PLP server
- `--debug` - Enable debug mode (show full request/response details)
- `--json` - Output as JSON
- `--config <path>` - Custom config file path

### `login`

Generate a temporary login token for the web dashboard.

```bash
plp login [options]
```

**Requirements:**
- Must run `activate` first to get a deployment hash

**Options:**
- `--debug` - Enable debug mode (show full request/response details)
- `--json` - Output as JSON
- `--config <path>` - Custom config file path

The token expires after 1 hour and can be used to access the plp.pub web dashboard.

### `update-name <name>`

Update your vendor name in the registry.

```bash
plp update-name "New Company Name" [options]
```

### `update-description <description>`

Update your listing description.

```bash
plp update-description "Your service description" [options]
```

### `set-visibility <visibility>`

Set listing visibility.

```bash
plp set-visibility public  # or private
```

### `delete-listing`

Permanently delete your listing from the registry.

```bash
plp delete-listing --confirm
```

**Options:**
- `--confirm` - Required to confirm deletion

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

## Configuration

Credentials are stored in `~/.plp/config.json`:

```json
{
  "registryUrl": "https://plp.pub",
  "slug": "your-vendor-slug",
  "installationHash": "...",
  "deploymentHash": "..."
}
```

Use `--config <path>` with any command to use a custom config file.

## Programmatic Usage

The package can also be used as a library:

```typescript
import {
  runComplianceTests,
  formatReport,
  readConfig,
  makeRequest,
  endpoints,
} from 'plp-registry';

// Run compliance tests
const groups = await runComplianceTests('https://api.example.com/v1', {
  authToken: 'your-token',
  timeout: 15000,
});

const report = formatReport('https://api.example.com/v1', groups);
console.log(report.passed ? 'Compliant!' : 'Not compliant');

// Read local config
const config = await readConfig();
console.log(`Registered as: ${config.slug}`);

// Make API requests
const response = await makeRequest(endpoints.login(), {
  method: 'POST',
  authToken: config.deploymentHash,
});
```

## CI/CD Integration

```yaml
# GitHub Actions example
- name: Test PLP Compliance
  run: npx plp-registry test ${{ secrets.PLP_SERVER_URL }} --json > compliance.json

- name: Check Compliance
  run: |
    if [ $(jq '.passed' compliance.json) != "true" ]; then
      echo "Server is not PLP compliant"
      exit 1
    fi
```

## Migration from @plp/compliance

If you were using `@plp/compliance`, the compliance testing functionality is unchanged:

```bash
# Old
plp-compliance https://api.example.com/v1

# New
plp test https://api.example.com/v1
```

Library imports remain compatible:

```typescript
// These still work
import { runComplianceTests, formatReport } from 'plp-registry';
```

## Requirements

- Node.js 18 or later

## License

MIT
