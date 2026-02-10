# Sentry to GitHub Issue Integration

An MCP (Model Context Protocol) based integration that connects Sentry error monitoring with GitHub issue tracking. This project provides MCP servers for both Sentry and GitHub, enabling automated workflows to create GitHub issues from Sentry alerts.

## Features

- **Sentry MCP Server**: Fetch and monitor Sentry issues via MCP tools
- **GitHub MCP Server**: Create and manage GitHub issues via MCP tools
- **Automated Integration**: Use with MCP-compatible agents to automatically create GitHub issues from Sentry errors

## Prerequisites

- Node.js 18 or higher
- A Sentry account with API access
- A GitHub account with API access
- Sentry Auth Token ([Create one here](https://sentry.io/settings/account/api/auth-tokens/))
- GitHub Personal Access Token ([Create one here](https://github.com/settings/tokens))

## Installation

1. Clone the repository:
```bash
git clone https://github.com/udn/sentry-to-github-issue.git
cd sentry-to-github-issue
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. Build the project:
```bash
npm run build
```

## Configuration

Edit the `.env` file with your credentials:

```env
# Sentry Configuration
SENTRY_AUTH_TOKEN=your_sentry_auth_token_here
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_sentry_project

# GitHub Configuration
GITHUB_TOKEN=your_github_token_here
GITHUB_OWNER=your_github_owner
GITHUB_REPO=your_github_repo
```

## Usage

### Running MCP Servers

Start the Sentry MCP Server:
```bash
npm start sentry
```

Start the GitHub MCP Server:
```bash
npm start github
```

### MCP Client Configuration

Add these servers to your MCP client configuration (e.g., Claude Desktop, VS Code):

```json
{
  "mcpServers": {
    "sentry": {
      "command": "node",
      "args": ["/path/to/sentry-to-github-issue/dist/index.js", "sentry"],
      "env": {
        "SENTRY_AUTH_TOKEN": "your_token",
        "SENTRY_ORG": "your_org",
        "SENTRY_PROJECT": "your_project"
      }
    },
    "github": {
      "command": "node",
      "args": ["/path/to/sentry-to-github-issue/dist/index.js", "github"],
      "env": {
        "GITHUB_TOKEN": "your_token",
        "GITHUB_OWNER": "your_owner",
        "GITHUB_REPO": "your_repo"
      }
    }
  }
}
```

## Available Tools

### Sentry MCP Server

1. **get_sentry_issues**: Fetch recent issues from Sentry
   - Parameters:
     - `limit` (number): Maximum number of issues to fetch (default: 10)
     - `query` (string, optional): Search query to filter issues

2. **get_sentry_issue_details**: Get detailed information about a specific Sentry issue
   - Parameters:
     - `issueId` (string, required): The Sentry issue ID

### GitHub MCP Server

1. **create_github_issue**: Create a new GitHub issue
   - Parameters:
     - `title` (string, required): Issue title
     - `body` (string, required): Issue body/description
     - `labels` (array, optional): Labels to add to the issue

2. **list_github_issues**: List GitHub issues in the repository
   - Parameters:
     - `state` (string): Filter by issue state (open, closed, all)
     - `labels` (string, optional): Comma-separated list of label names

3. **search_github_issues**: Search for GitHub issues
   - Parameters:
     - `query` (string, required): Search query

## Example Workflows

### Automatically Create GitHub Issues from Sentry Alerts

With both MCP servers running in your MCP client, you can use natural language to:

1. "Check the latest Sentry issues"
2. "Create a GitHub issue for Sentry issue #12345"
3. "List all open GitHub issues with label 'bug'"

Or create automated workflows:
```
1. Fetch unresolved Sentry issues
2. For each high-priority issue:
   - Check if a GitHub issue already exists
   - If not, create a new GitHub issue with:
     - Title: Sentry issue title
     - Body: Error details, stack trace, and Sentry permalink
     - Labels: ['bug', 'sentry', priority]
```

## Architecture

```
┌─────────────────────────────────────────┐
│         MCP Client (Claude/VS Code)     │
└───────────────┬─────────────────────────┘
                │
        ┌───────┴────────┐
        │                │
┌───────▼────────┐  ┌───▼──────────────┐
│ Sentry MCP     │  │ GitHub MCP       │
│ Server         │  │ Server           │
│                │  │                  │
│ - Get Issues   │  │ - Create Issue   │
│ - Get Details  │  │ - List Issues    │
│                │  │ - Search Issues  │
└───────┬────────┘  └───┬──────────────┘
        │               │
        │               │
┌───────▼────────┐  ┌───▼──────────────┐
│ Sentry API     │  │ GitHub API       │
└────────────────┘  └──────────────────┘
```

## Development

### Building
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.