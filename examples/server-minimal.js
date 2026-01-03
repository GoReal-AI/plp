/**
 * Minimal PLP server example
 */

const express = require('express');
const { plpMiddleware } = require('@plp/express-middleware');

const app = express();

// Parse JSON bodies
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Add PLP endpoints at /v1
app.use('/v1', plpMiddleware({
  storage: './prompts-db',
  // Uncomment to enable authentication:
  // apiKey: process.env.PLP_API_KEY,
}));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 PLP server running on http://localhost:${PORT}`);
  console.log(`📚 Endpoints available at http://localhost:${PORT}/v1/prompts`);
  console.log(`\nTry it out:`);
  console.log(`  curl -X PUT http://localhost:${PORT}/v1/prompts/test/hello \\`);
  console.log(`    -H "Content-Type: application/json" \\`);
  console.log(`    -d '{"content": "Hello World!", "meta": {}}'`);
  console.log(`\n  curl http://localhost:${PORT}/v1/prompts/test/hello`);
});
