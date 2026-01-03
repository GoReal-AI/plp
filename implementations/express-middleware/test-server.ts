/**
 * Test server for compliance testing
 */

import express from 'express';
import { plpMiddleware } from './src/index.js';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

const app = express();
app.use(express.json());

// Create temporary storage directory
const storageDir = path.join(os.tmpdir(), `plp-test-${Date.now()}`);
fs.mkdirSync(storageDir, { recursive: true });

// Mount PLP middleware at /v1
app.use('/v1', plpMiddleware({ storage: storageDir }));

// Also expose discovery endpoint at root (best practice for PLP servers)
app.get('/.well-known/plp', (_req, res) => {
  res.json({
    plp_version: '1.0',
    capabilities: {
      versioning: true,
      list: false,
      search: false,
    },
  });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`PLP test server running at http://localhost:${PORT}/v1`);
  console.log(`Storage: ${storageDir}`);
  console.log('Press Ctrl+C to stop');
});

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  server.close();
  // Clean up temp directory
  try {
    fs.rmSync(storageDir, { recursive: true, force: true });
  } catch {}
  process.exit(0);
});
