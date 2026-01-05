/**
 * PLP Compliance Test Reporter
 */

import type { TestGroup, ComplianceReport } from './types.js';

/**
 * Format test groups into a compliance report
 */
export function formatReport(serverUrl: string, groups: TestGroup[]): ComplianceReport {
  const timestamp = new Date().toISOString();

  let total = 0;
  let passed = 0;
  let totalDuration = 0;

  for (const group of groups) {
    for (const test of group.tests) {
      total++;
      totalDuration += test.duration;
      if (test.passed) {
        passed++;
      }
    }
  }

  // Check if all required tests passed (exclude RECOMMENDED group)
  const requiredGroups = groups.filter(g => !g.name.includes('RECOMMENDED'));
  const allRequiredPassed = requiredGroups.every(group =>
    group.tests.every(test => test.passed)
  );

  return {
    serverUrl,
    timestamp,
    duration: totalDuration,
    passed: allRequiredPassed,
    summary: {
      total,
      passed,
      failed: total - passed,
    },
    groups,
  };
}

/**
 * Format report as plain text for terminal output
 */
export function formatText(report: ComplianceReport, useColors = true): string {
  const lines: string[] = [];

  // Color helpers
  const green = (s: string) => useColors ? `\x1b[32m${s}\x1b[0m` : s;
  const red = (s: string) => useColors ? `\x1b[31m${s}\x1b[0m` : s;
  const yellow = (s: string) => useColors ? `\x1b[33m${s}\x1b[0m` : s;
  const bold = (s: string) => useColors ? `\x1b[1m${s}\x1b[0m` : s;
  const dim = (s: string) => useColors ? `\x1b[2m${s}\x1b[0m` : s;

  lines.push('');
  lines.push(bold('PLP Compliance Test Results'));
  lines.push(dim('─'.repeat(50)));
  lines.push(`Server: ${report.serverUrl}`);
  lines.push(`Time:   ${report.timestamp}`);
  lines.push('');

  for (const group of report.groups) {
    const groupPassed = group.tests.every(t => t.passed);
    const icon = groupPassed ? green('✓') : red('✗');
    lines.push(`${icon} ${bold(group.name)}`);

    for (const test of group.tests) {
      const testIcon = test.passed ? green('  ✓') : red('  ✗');
      const duration = dim(`(${test.duration.toFixed(0)}ms)`);
      lines.push(`${testIcon} ${test.name} ${duration}`);

      if (!test.passed) {
        if (test.error) {
          lines.push(red(`      Error: ${test.error}`));
        }

        // Show request details for failed tests
        if (test.request) {
          lines.push(dim(`      Request: ${test.request.method} ${test.request.url}`));
          if (test.request.headers && Object.keys(test.request.headers).length > 0) {
            lines.push(dim(`      Headers:`));
            for (const [key, value] of Object.entries(test.request.headers)) {
              // Mask token for security but show it's present
              if (key === 'Authorization' && value) {
                const tokenPreview = value.length > 20
                  ? value.substring(0, 20) + '...'
                  : value;
                lines.push(dim(`        ${key}: ${tokenPreview}`));
              } else {
                lines.push(dim(`        ${key}: ${value}`));
              }
            }
          }
        }

        if (test.response) {
          lines.push(dim(`      Response: ${test.response.status}`));
        }
      }
    }
    lines.push('');
  }

  lines.push(dim('─'.repeat(50)));
  lines.push(`Total:  ${report.summary.passed}/${report.summary.total} tests passed`);
  lines.push(`Time:   ${report.duration.toFixed(0)}ms`);
  lines.push('');

  if (report.passed) {
    lines.push(green(bold('✓ SERVER IS PLP COMPLIANT')));
  } else {
    lines.push(red(bold('✗ SERVER IS NOT PLP COMPLIANT')));
    lines.push('');
    lines.push(yellow('Fix the failing tests above to achieve compliance.'));
  }

  lines.push('');

  return lines.join('\n');
}

/**
 * Format report as JSON
 */
export function formatJson(report: ComplianceReport): string {
  return JSON.stringify(report, null, 2);
}
