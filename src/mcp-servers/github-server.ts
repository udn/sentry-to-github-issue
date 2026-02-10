import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Octokit } from '@octokit/rest';
import { 
  GitHubIssue, 
  CreateGitHubIssueArgs, 
  ListGitHubIssuesArgs, 
  SearchGitHubIssuesArgs 
} from '../types/index.js';

/**
 * MCP Server for GitHub integration
 * Provides tools to create and manage GitHub issues
 */
export class GitHubMCPServer {
  private server: Server;
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(token: string, owner: string, repo: string) {
    this.owner = owner;
    this.repo = repo;
    this.octokit = new Octokit({ auth: token });
    
    this.server = new Server(
      {
        name: 'github-mcp-server',
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
          name: 'create_github_issue',
          description: 'Create a new GitHub issue',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Issue title',
              },
              body: {
                type: 'string',
                description: 'Issue body/description',
              },
              labels: {
                type: 'array',
                items: { type: 'string' },
                description: 'Labels to add to the issue',
              },
            },
            required: ['title', 'body'],
          },
        },
        {
          name: 'list_github_issues',
          description: 'List GitHub issues in the repository',
          inputSchema: {
            type: 'object',
            properties: {
              state: {
                type: 'string',
                enum: ['open', 'closed', 'all'],
                description: 'Filter by issue state',
                default: 'open',
              },
              labels: {
                type: 'string',
                description: 'Comma-separated list of label names',
              },
            },
          },
        },
        {
          name: 'search_github_issues',
          description: 'Search for GitHub issues',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query',
              },
            },
            required: ['query'],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'create_github_issue':
          const createArgs = this.parseCreateGitHubIssueArgs(args);
          return await this.createGitHubIssue({
            title: createArgs.title,
            body: createArgs.body,
            labels: createArgs.labels,
          });
        
        case 'list_github_issues':
          const listArgs = this.parseListGitHubIssuesArgs(args);
          return await this.listGitHubIssues(
            listArgs.state || 'open', 
            listArgs.labels
          );
        
        case 'search_github_issues':
          const searchArgs = this.parseSearchGitHubIssuesArgs(args);
          return await this.searchGitHubIssues(searchArgs.query);
        
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private parseCreateGitHubIssueArgs(args: unknown): CreateGitHubIssueArgs {
    const parsed = args as Record<string, unknown>;
    if (typeof parsed?.title !== 'string' || typeof parsed?.body !== 'string') {
      throw new Error('Both title and body are required and must be strings');
    }
    return {
      title: parsed.title,
      body: parsed.body,
      labels: Array.isArray(parsed.labels) 
        ? parsed.labels.filter((l): l is string => typeof l === 'string')
        : undefined,
    };
  }

  private parseListGitHubIssuesArgs(args: unknown): ListGitHubIssuesArgs {
    const parsed = args as Record<string, unknown>;
    return {
      state: typeof parsed?.state === 'string' ? parsed.state : undefined,
      labels: typeof parsed?.labels === 'string' ? parsed.labels : undefined,
    };
  }

  private parseSearchGitHubIssuesArgs(args: unknown): SearchGitHubIssuesArgs {
    const parsed = args as Record<string, unknown>;
    if (typeof parsed?.query !== 'string') {
      throw new Error('query is required and must be a string');
    }
    return {
      query: parsed.query,
    };
  }

  private async createGitHubIssue(issue: GitHubIssue): Promise<any> {
    try {
      const response = await this.octokit.issues.create({
        owner: this.owner,
        repo: this.repo,
        title: issue.title,
        body: issue.body,
        labels: issue.labels,
      });

      return {
        content: [
          {
            type: 'text',
            text: `GitHub issue created successfully!\nIssue #${response.data.number}: ${response.data.html_url}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error creating GitHub issue: ${error}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async listGitHubIssues(state: string = 'open', labels?: string): Promise<any> {
    try {
      const response = await this.octokit.issues.listForRepo({
        owner: this.owner,
        repo: this.repo,
        state: state as 'open' | 'closed' | 'all',
        labels,
      });

      const issues = response.data.map(issue => ({
        number: issue.number,
        title: issue.title,
        state: issue.state,
        url: issue.html_url,
        labels: issue.labels.map(l => typeof l === 'string' ? l : l.name),
      }));

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
            text: `Error listing GitHub issues: ${error}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async searchGitHubIssues(query: string): Promise<any> {
    try {
      const searchQuery = `${query} repo:${this.owner}/${this.repo}`;
      const response = await this.octokit.search.issuesAndPullRequests({
        q: searchQuery,
      });

      const issues = response.data.items.map(issue => ({
        number: issue.number,
        title: issue.title,
        state: issue.state,
        url: issue.html_url,
      }));

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
            text: `Error searching GitHub issues: ${error}`,
          },
        ],
        isError: true,
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('GitHub MCP server running on stdio');
  }
}
