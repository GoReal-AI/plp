/**
 * Example usage of PLP Express middleware
 */

import express from 'express';
import { plpMiddleware } from './index';

const app = express();

// Parse JSON bodies
app.use(express.json());

// Add PLP endpoints at /v1
app.use(
  '/v1',
  plpMiddleware({
    storage: './prompts-db',
    // Optional: Add API key authentication
    // apiKey: 'your-secret-key',
    // Or custom validator:
    // validateApiKey: async (key) => {
    //   return await yourAuthService.validate(key);
    // }
  })
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`PLP server running on http://localhost:${PORT}`);
  console.log(`Endpoints available at http://localhost:${PORT}/v1/prompts`);
});
