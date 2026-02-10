# Example Workflow: Sentry to GitHub Issue Automation

This document demonstrates how to use the Sentry and GitHub MCP servers together to automate issue creation.

## Scenario: Auto-create GitHub issues from Sentry errors

### Step 1: Fetch Recent Sentry Issues

Using the Sentry MCP server, call the `get_sentry_issues` tool:

```json
{
  "tool": "get_sentry_issues",
  "arguments": {
    "limit": 5,
    "query": "is:unresolved"
  }
}
```

### Step 2: Filter High Priority Issues

From the response, identify issues that meet your criteria:
- High severity (error or fatal)
- High user impact
- Recent occurrences

### Step 3: Check for Existing GitHub Issues

Using the GitHub MCP server, search for existing issues:

```json
{
  "tool": "search_github_issues",
  "arguments": {
    "query": "is:open label:sentry [Sentry Issue Title]"
  }
}
```

### Step 4: Create GitHub Issue

If no duplicate exists, create a new GitHub issue:

```json
{
  "tool": "create_github_issue",
  "arguments": {
    "title": "[Sentry] TypeError in payment processing",
    "body": "## Sentry Error Report\n\n**Error Type:** TypeError\n**Message:** Cannot read property 'amount' of undefined\n**Level:** error\n**Count:** 42\n**Users Affected:** 15\n**First Seen:** 2024-01-15T10:30:00Z\n**Last Seen:** 2024-01-15T14:45:00Z\n\n**Sentry Link:** https://sentry.io/issues/12345\n\n## Stack Trace\n```\nat processPayment (payment.js:45:12)\nat handleCheckout (checkout.js:78:5)\n```\n\n## Next Steps\n- [ ] Review error logs\n- [ ] Reproduce in staging\n- [ ] Implement fix\n- [ ] Add test coverage",
    "labels": ["bug", "sentry", "high-priority"]
  }
}
```

## Automated Workflow Pseudo-code

```javascript
// 1. Fetch unresolved Sentry issues
const sentryIssues = await getSentryIssues({ limit: 20, query: "is:unresolved" });

// 2. Filter high-priority issues
const highPriorityIssues = sentryIssues.filter(issue => 
  issue.level === 'error' || issue.level === 'fatal'
  && issue.userCount > 5
);

// 3. For each high-priority issue
for (const sentryIssue of highPriorityIssues) {
  // Check if GitHub issue already exists
  const existingIssues = await searchGitHubIssues({
    query: `is:open label:sentry "${sentryIssue.title}"`
  });
  
  if (existingIssues.length === 0) {
    // Create new GitHub issue
    await createGitHubIssue({
      title: `[Sentry] ${sentryIssue.title}`,
      body: formatIssueBody(sentryIssue),
      labels: ['bug', 'sentry', getPriorityLabel(sentryIssue)]
    });
    
    console.log(`Created GitHub issue for Sentry #${sentryIssue.id}`);
  }
}
```

## Integration with GitHub Actions

You can also trigger this workflow using GitHub Actions:

```yaml
name: Sentry to GitHub Sync
on:
  schedule:
    - cron: '0 * * * *'  # Run every hour
  workflow_dispatch:

jobs:
  sync-issues:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Sync Sentry Issues
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
          SENTRY_PROJECT: ${{ secrets.SENTRY_PROJECT }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITHUB_OWNER: ${{ github.repository_owner }}
          GITHUB_REPO: ${{ github.event.repository.name }}
        run: |
          # Your sync script here
          node dist/sync.js
```

## Tips

1. **Avoid Duplicates**: Always search for existing issues before creating new ones
2. **Use Labels**: Tag issues with 'sentry' for easy filtering
3. **Add Context**: Include stack traces, error counts, and Sentry permalinks
4. **Set Priority**: Map Sentry severity levels to GitHub labels
5. **Auto-close**: Consider auto-closing GitHub issues when Sentry issues are resolved
