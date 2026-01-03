#!/usr/bin/env node

/**
 * PLP Compliance CLI
 */

import { program } from 'commander';
import { runComplianceTests } from './tests/index.js';
import { formatReport, formatText, formatJson } from './reporter.js';

program
  .name('plp-compliance')
  .description('Test PLP server compliance')
  .version('1.0.0')
  .argument('<url>', 'Base URL of the PLP server (e.g., https://api.example.com/v1)')
  .option('-t, --token <token>', 'Bearer token for authentication')
  .option('--timeout <ms>', 'Request timeout in milliseconds', '10000')
  .option('--json', 'Output results as JSON')
  .option('--no-color', 'Disable colored output')
  .action(async (url: string, options: { token?: string; timeout: string; json?: boolean; color: boolean }) => {
    try {
      // Validate URL
      let baseUrl: string;
      try {
        const parsed = new URL(url);
        baseUrl = parsed.toString().replace(/\/$/, '');
      } catch {
        console.error('Error: Invalid URL provided');
        process.exit(2);
      }

      // Run tests
      const groups = await runComplianceTests(baseUrl, {
        authToken: options.token,
        timeout: parseInt(options.timeout, 10),
      });

      // Generate report
      const report = formatReport(baseUrl, groups);

      // Output
      if (options.json) {
        console.log(formatJson(report));
      } else {
        console.log(formatText(report, options.color));
      }

      // Exit with appropriate code
      process.exit(report.passed ? 0 : 1);
    } catch (error) {
      if (!options.json) {
        console.error('Error running compliance tests:');
        console.error(error instanceof Error ? error.message : String(error));
      } else {
        console.log(JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
          passed: false,
        }));
      }
      process.exit(2);
    }
  });

program.parse();
