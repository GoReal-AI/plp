# Contributing to PLP

Thank you for your interest in contributing to **PLP (Prompt Library Protocol)**! 🎉

PLP is an open standard, and we welcome contributions from the community to help make it better.

## Ways to Contribute

### 1. 📝 Improve Documentation

- Fix typos or clarify existing documentation
- Add examples and use cases
- Translate documentation to other languages
- Write tutorials and guides

### 2. 🐛 Report Bugs

Found a bug in the specification or implementations? Please [open an issue](https://github.com/gorealai/plp/issues/new) with:

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Relevant code snippets or logs

### 3. 💡 Suggest Features

Have an idea for improving PLP? We'd love to hear it! Please:

- Check existing issues first to avoid duplicates
- Describe the problem you're trying to solve
- Explain your proposed solution
- Consider backward compatibility

### 4. 🔧 Contribute Code

#### SDKs

Build a client SDK for a new language:

- Follow the [specification](spec/SPEC.md)
- Include comprehensive tests
- Add documentation and examples
- Submit a PR to add it to the repo

**Wanted SDKs:**
- Go
- Rust
- Ruby
- PHP
- Java
- C#

#### Server Implementations

Build a server implementation or helper:

- For new frameworks (FastAPI, Flask, Nest.js, etc.)
- For new storage backends (PostgreSQL, MongoDB, Redis)
- For cloud platforms (AWS Lambda, Vercel, Cloudflare Workers)

#### Tools & Integrations

- CLI tools for managing prompts
- IDE extensions
- Testing utilities
- Monitoring/observability tools

### 5. 🧪 Testing

- Write tests for existing implementations
- Test edge cases and error scenarios
- Performance testing and benchmarks

## Development Setup

### Prerequisites

- Node.js 16+ (for JavaScript/TypeScript work)
- Python 3.8+ (for Python work)
- Git

### Getting Started

```bash
# Clone the repository
git clone https://github.com/gorealai/plp.git
cd plp

# JavaScript SDK
cd sdks/js
npm install
npm test
npm run build

# Python SDK
cd sdks/python
pip install -e ".[dev]"
pytest
```

## Code Standards

### JavaScript/TypeScript

- Use TypeScript for type safety
- Follow existing code style (we use ESLint + Prettier)
- Write tests using Vitest
- Document public APIs with JSDoc

```bash
npm run lint
npm run test
npm run build
```

### Python

- Follow PEP 8 style guide
- Use type hints (Python 3.8+)
- Write tests using pytest
- Format with Black

```bash
black src/ tests/
mypy src/
pytest
```

### Documentation

- Use clear, concise language
- Include code examples
- Test all code examples
- Follow existing formatting

## Submitting Changes

### Pull Request Process

1. **Fork the repository** and create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the code standards

3. **Write tests** for new functionality

4. **Update documentation** if needed

5. **Run tests** to ensure everything passes:
   ```bash
   npm test  # or pytest
   ```

6. **Commit your changes** with clear messages:
   ```bash
   git commit -m "Add feature: description"
   ```

7. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Open a Pull Request** with:
   - Clear title and description
   - Reference any related issues
   - Screenshots/examples if applicable

### PR Guidelines

- ✅ One feature/fix per PR
- ✅ Include tests
- ✅ Update documentation
- ✅ Keep commits clean and atomic
- ✅ Respond to review feedback

## Specification Changes

Changes to the core specification require more careful consideration:

1. **Discuss first** - Open an issue to discuss the change
2. **Backward compatibility** - Consider existing implementations
3. **Consensus** - Major changes need community agreement
4. **Version bumps** - Breaking changes require version increment

### Versioning

PLP follows semantic versioning:

- **Patch (1.0.x)** - Bug fixes, clarifications
- **Minor (1.x.0)** - New optional features, additions
- **Major (x.0.0)** - Breaking changes

---

## Governance

### How Decisions Are Made

PLP is maintained by [GoReal.AI](https://goreal.ai) with input from the community.

#### Specification Proposals

1. **Open an Issue** - Label it with `spec-proposal`
2. **Community Feedback** - Allow 2 weeks for discussion
3. **Maintainer Review** - Maintainers evaluate feasibility and impact
4. **Decision** - Proposals are accepted, rejected, or deferred
5. **Implementation** - Accepted proposals are added to the spec

#### Types of Changes

| Change Type | Process | Examples |
|-------------|---------|----------|
| Typo/Clarification | Direct PR | Fix wording, add examples |
| Minor Addition | Issue + Discussion | New optional field in meta |
| New Endpoint | RFC Process | Add LIST endpoint |
| Breaking Change | Major RFC + Version Bump | Change envelope format |

#### RFC Process (Major Changes)

For significant changes:

1. Create a detailed proposal document
2. Open issue with `rfc` label
3. Allow 4 weeks for community input
4. Address all concerns raised
5. Maintainers vote on acceptance
6. If accepted, schedule for next major version

### Maintainers

Current maintainers:
- GoReal.AI Team (@gorealai)

To become a maintainer:
- Consistent, high-quality contributions
- Deep understanding of the protocol
- Nomination by existing maintainer
- Community endorsement

### Dispute Resolution

1. Discussion in GitHub issue
2. Maintainer mediation if needed
3. Final decision by lead maintainer
4. Decisions documented for transparency

## Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Provide constructive feedback
- Focus on the idea, not the person

### Communication

- **GitHub Issues** - Bug reports, feature requests
- **Pull Requests** - Code contributions
- **Discussions** - General questions and ideas

## Recognition

Contributors will be:

- Listed in release notes
- Credited in documentation
- Added to CONTRIBUTORS.md (coming soon)

## Questions?

Need help? Feel free to:

- Open a [GitHub Discussion](https://github.com/gorealai/plp/discussions)
- Comment on existing issues
- Reach out to the maintainers

---

Thank you for helping make PLP better! 🚀

**Built with ❤️ by the PLP Community**
