import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { 
  GetSentryIssuesArgs, 
  GetSentryIssueDetailsArgs 
} from '../types/index.js';

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
          const getSentryArgs = this.parseGetSentryIssuesArgs(args);
          return await this.getSentryIssues(
            getSentryArgs.limit || 10, 
            getSentryArgs.query
          );
        
        case 'get_sentry_issue_details':
          const getDetailsArgs = this.parseGetSentryIssueDetailsArgs(args);
          return await this.getSentryIssueDetails(getDetailsArgs.issueId);
        
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private parseGetSentryIssuesArgs(args: unknown): GetSentryIssuesArgs {
    const parsed = args as Record<string, unknown>;
    return {
      limit: typeof parsed?.limit === 'number' ? parsed.limit : undefined,
      query: typeof parsed?.query === 'string' ? parsed.query : undefined,
    };
  }

  private parseGetSentryIssueDetailsArgs(args: unknown): GetSentryIssueDetailsArgs {
    const parsed = args as Record<string, unknown>;
    if (typeof parsed?.issueId !== 'string') {
      throw new Error('issueId is required and must be a string');
    }
    return {
      issueId: parsed.issueId,
    };
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
