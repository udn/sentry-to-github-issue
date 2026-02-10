import dotenv from 'dotenv';
import { SentryMCPServer } from './mcp-servers/sentry-server.js';
import { GitHubMCPServer } from './mcp-servers/github-server.js';
import { SentryToGitHubConfig } from './types/index.js';

// Load environment variables
dotenv.config();

/**
 * Main application to integrate Sentry with GitHub using MCP servers
 */
class SentryToGitHubAgent {
  private config: SentryToGitHubConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): SentryToGitHubConfig {
    const requiredEnvVars = [
      'SENTRY_AUTH_TOKEN',
      'SENTRY_ORG',
      'SENTRY_PROJECT',
      'GITHUB_TOKEN',
      'GITHUB_OWNER',
      'GITHUB_REPO',
    ];

    const missing = requiredEnvVars.filter(v => !process.env[v]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    return {
      sentryDsn: process.env.SENTRY_DSN || '',
      sentryAuthToken: process.env.SENTRY_AUTH_TOKEN!,
      sentryOrg: process.env.SENTRY_ORG!,
      sentryProject: process.env.SENTRY_PROJECT!,
      githubToken: process.env.GITHUB_TOKEN!,
      githubOwner: process.env.GITHUB_OWNER!,
      githubRepo: process.env.GITHUB_REPO!,
    };
  }

  /**
   * Start the MCP servers
   */
  async startServers() {
    const mode = process.argv[2];

    if (mode === 'sentry') {
      console.error('Starting Sentry MCP Server...');
      const sentryServer = new SentryMCPServer(
        this.config.sentryAuthToken,
        this.config.sentryOrg,
        this.config.sentryProject
      );
      await sentryServer.run();
    } else if (mode === 'github') {
      console.error('Starting GitHub MCP Server...');
      const githubServer = new GitHubMCPServer(
        this.config.githubToken,
        this.config.githubOwner,
        this.config.githubRepo
      );
      await githubServer.run();
    } else {
      console.error(`
Sentry to GitHub Issue Integration

Usage:
  npm start sentry    - Start the Sentry MCP server
  npm start github    - Start the GitHub MCP server

This application provides MCP servers for:
1. Sentry: Fetch and monitor Sentry issues
2. GitHub: Create and manage GitHub issues

To use these servers, configure your MCP client to connect to them
and create workflows that automatically create GitHub issues from Sentry alerts.

Configuration:
  Copy .env.example to .env and configure your credentials.
      `);
      process.exit(1);
    }
  }
}

// Run the application
const agent = new SentryToGitHubAgent();
agent.startServers().catch(error => {
  console.error('Error starting servers:', error);
  process.exit(1);
});
