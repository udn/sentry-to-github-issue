import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { SentryIssue } from '../types/index.js';

/**
 * MCP Server for Sentry integration
 * Provides tools to fetch and manage Sentry issues
 */
export class SentryMCPServer {
  private server: Server;
  private authToken: string;
  private org: string;
  private project: string;

  constructor(authToken: string, org: string, project: string) {
    this.authToken = authToken;
    this.org = org;
    this.project = project;
    
    this.server = new Server(
      {
        name: 'sentry-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_sentry_issues',
          description: 'Fetch recent issues from Sentry',
          inputSchema: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Maximum number of issues to fetch',
                default: 10,
              },
              query: {
                type: 'string',
                description: 'Search query to filter issues',
              },
            },
          },
        },
        {
          name: 'get_sentry_issue_details',
          description: 'Get detailed information about a specific Sentry issue',
          inputSchema: {
            type: 'object',
            properties: {
              issueId: {
                type: 'string',
                description: 'The Sentry issue ID',
              },
            },
            required: ['issueId'],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'get_sentry_issues':
          return await this.getSentryIssues(
            (args as any)?.limit || 10, 
            (args as any)?.query
          );
        
        case 'get_sentry_issue_details':
          if (!(args as any)?.issueId) {
            throw new Error('issueId is required');
          }
          return await this.getSentryIssueDetails((args as any).issueId);
        
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async getSentryIssues(limit: number = 10, query?: string): Promise<any> {
    try {
      const url = `https://sentry.io/api/0/projects/${this.org}/${this.project}/issues/`;
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(query && { query }),
      });

      const response = await fetch(`${url}?${params}`, {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Sentry API error: ${response.statusText}`);
      }

      const issues = await response.json();
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(issues, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching Sentry issues: ${error}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async getSentryIssueDetails(issueId: string): Promise<any> {
    try {
      const url = `https://sentry.io/api/0/issues/${issueId}/`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Sentry API error: ${response.statusText}`);
      }

      const issue = await response.json();
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(issue, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching Sentry issue details: ${error}`,
          },
        ],
        isError: true,
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Sentry MCP server running on stdio');
  }
}
