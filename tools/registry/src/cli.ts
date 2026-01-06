#!/usr/bin/env node

/**
 * PLP Registry CLI
 *
 * Manage PLP server registration, activation, and listing on plp.pub
 */

import { program } from 'commander';
import { testCommand } from './commands/test.js';
import { installCommand } from './commands/install.js';
import { activateCommand } from './commands/activate.js';
import { loginCommand } from './commands/login.js';
import { updateNameCommand } from './commands/update-name.js';
import { updateDescriptionCommand } from './commands/update-description.js';
import { setVisibilityCommand } from './commands/set-visibility.js';
import { deleteListingCommand } from './commands/delete-listing.js';
import type {
  TestCommandOptions,
  InstallCommandOptions,
  CommandOptions,
  DeleteCommandOptions,
} from './types.js';

program
  .name('plp-registry')
  .description('PLP Registry CLI - Manage your PLP server listing on plp.pub')
  .version('2.0.0');

// =============================================================================
// Test Command
// =============================================================================

program
  .command('test')
  .description('Run compliance tests against a PLP server')
  .argument('<url>', 'Base URL of the PLP server (e.g., https://api.example.com/v1)')
  .option('-t, --token <token>', 'Bearer token for authentication')
  .option('--timeout <ms>', 'Request timeout in milliseconds', '10000')
  .option('--debug', 'Enable debug mode (show full request/response details)')
  .option('--json', 'Output results as JSON')
  .option('--no-color', 'Disable colored output')
  .action((url: string, options: TestCommandOptions) => {
    void testCommand(url, options);
  });

// =============================================================================
// Install Command
// =============================================================================

program
  .command('install')
  .description('Complete installation with plp.pub registry')
  .argument('<hash>', 'Installation hash from plp.pub')
  .requiredOption('--vendor-name <name>', 'Your vendor/organization name')
  .option('--vendor-slug <slug>', 'Custom vendor slug (auto-generated if not provided)')
  .option('--email <email>', 'Contact email')
  .option('--debug', 'Enable debug mode (show full request/response details)')
  .option('--json', 'Output results as JSON')
  .option('--no-color', 'Disable colored output')
  .option('--config <path>', 'Custom config file path')
  .action((hash: string, options: InstallCommandOptions) => {
    void installCommand(hash, options);
  });

// =============================================================================
// Activate Command
// =============================================================================

program
  .command('activate')
  .description('Activate your PLP server with the registry')
  .argument('<serverUrl>', 'Your PLP server URL (e.g., https://api.example.com/v1)')
  .option('--api-key <key>', 'API key for authenticating with your PLP server')
  .option('--debug', 'Enable debug mode (show full request/response details)')
  .option('--json', 'Output results as JSON')
  .option('--no-color', 'Disable colored output')
  .option('--config <path>', 'Custom config file path')
  .action((serverUrl: string, options: CommandOptions) => {
    void activateCommand(serverUrl, options);
  });

// =============================================================================
// Login Command
// =============================================================================

program
  .command('login')
  .description('Generate a temporary login token (1-hour expiry)')
  .option('--debug', 'Enable debug mode (show full request/response details)')
  .option('--json', 'Output results as JSON')
  .option('--no-color', 'Disable colored output')
  .option('--config <path>', 'Custom config file path')
  .action((options: CommandOptions) => {
    void loginCommand(options);
  });

// =============================================================================
// Update Name Command
// =============================================================================

program
  .command('update-name')
  .description('Update your vendor name in the registry')
  .argument('<name>', 'New vendor name')
  .option('--debug', 'Enable debug mode (show full request/response details)')
  .option('--json', 'Output results as JSON')
  .option('--no-color', 'Disable colored output')
  .option('--config <path>', 'Custom config file path')
  .action((name: string, options: CommandOptions) => {
    void updateNameCommand(name, options);
  });

// =============================================================================
// Update Description Command
// =============================================================================

program
  .command('update-description')
  .description('Update your listing description')
  .argument('<description>', 'New description')
  .option('--debug', 'Enable debug mode (show full request/response details)')
  .option('--json', 'Output results as JSON')
  .option('--no-color', 'Disable colored output')
  .option('--config <path>', 'Custom config file path')
  .action((description: string, options: CommandOptions) => {
    void updateDescriptionCommand(description, options);
  });

// =============================================================================
// Set Visibility Command
// =============================================================================

program
  .command('set-visibility')
  .description('Set listing visibility (public or private)')
  .argument('<visibility>', 'Visibility: public or private')
  .option('--debug', 'Enable debug mode (show full request/response details)')
  .option('--json', 'Output results as JSON')
  .option('--no-color', 'Disable colored output')
  .option('--config <path>', 'Custom config file path')
  .action((visibility: string, options: CommandOptions) => {
    void setVisibilityCommand(visibility, options);
  });

// =============================================================================
// Delete Listing Command
// =============================================================================

program
  .command('delete-listing')
  .description('Permanently delete your listing from the registry')
  .option('--confirm', 'Confirm deletion (required)')
  .option('--debug', 'Enable debug mode (show full request/response details)')
  .option('--json', 'Output results as JSON')
  .option('--no-color', 'Disable colored output')
  .option('--config <path>', 'Custom config file path')
  .action((options: DeleteCommandOptions) => {
    void deleteListingCommand(options);
  });

// =============================================================================
// Parse and Execute
// =============================================================================

program.parse();
