# sentry-to-github-issue

A Python script to automatically fetch issues from Sentry and create corresponding GitHub issues.

## Features

- 🔍 Fetch issues from Sentry using the Sentry API
- 📝 Create GitHub issues with formatted information from Sentry
- 🏷️ Add custom labels to created issues
- 🔎 Query and filter Sentry issues
- ✅ Skip duplicate issues that already exist in GitHub
- 🎯 Fetch specific Sentry issues by ID

## Prerequisites

- Python 3.7 or higher
- A Sentry account with API access
- A GitHub account with repository access
- Sentry Auth Token ([How to get one](https://docs.sentry.io/api/auth/))
- GitHub Personal Access Token ([How to create one](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token))

## Installation

1. Clone this repository:
```bash
git clone https://github.com/udn/sentry-to-github-issue.git
cd sentry-to-github-issue
```

2. Install required dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file from the example:
```bash
cp .env.example .env
```

4. Edit `.env` and add your credentials:
```bash
# Sentry Configuration
SENTRY_AUTH_TOKEN=your_sentry_auth_token_here
SENTRY_ORG=your_organization_slug
SENTRY_PROJECT=your_project_slug

# GitHub Configuration
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_REPO=owner/repo
```

## Usage

### Basic Usage

Fetch the latest 10 Sentry issues and create GitHub issues:
```bash
python sentry_to_github.py
```

### Fetch Specific Number of Issues

```bash
python sentry_to_github.py --limit 20
```

### Fetch a Specific Sentry Issue

```bash
python sentry_to_github.py --issue-id 1234567890
```

### Filter Issues with a Query

```bash
python sentry_to_github.py --query "is:unresolved"
```

### Add Custom Labels

```bash
python sentry_to_github.py --labels "bug,sentry,urgent"
```

### Skip Existing Issues

Avoid creating duplicate issues in GitHub:
```bash
python sentry_to_github.py --skip-existing
```

### Combined Example

```bash
python sentry_to_github.py --query "is:unresolved" --limit 5 --labels "bug,sentry" --skip-existing
```

## Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--issue-id` | Fetch a specific Sentry issue by ID | None |
| `--query` | Query string to filter Sentry issues | "" |
| `--limit` | Maximum number of issues to fetch | 10 |
| `--labels` | Comma-separated list of labels to add | "sentry" |
| `--skip-existing` | Skip creating issues that already exist | False |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SENTRY_AUTH_TOKEN` | Yes | Sentry API authentication token |
| `SENTRY_ORG` | Yes | Sentry organization slug |
| `SENTRY_PROJECT` | Yes | Sentry project slug |
| `GITHUB_TOKEN` | Yes | GitHub personal access token |
| `GITHUB_REPO` | Yes | GitHub repository (format: owner/repo) |
| `SENTRY_API_URL` | No | Sentry API URL (default: https://sentry.io/api/0/) |

## How It Works

1. The script connects to the Sentry API using your credentials
2. Fetches issues based on your query parameters
3. For each Sentry issue:
   - Formats the issue information (error type, message, counts, etc.)
   - Optionally checks if a similar issue already exists in GitHub
   - Creates a new GitHub issue with:
     - Title containing the error type and culprit
     - Body with detailed information from Sentry
     - Link back to the original Sentry issue
     - Custom labels if specified

## GitHub Issue Format

Created GitHub issues include:
- **Title**: `[Sentry] ErrorType: culprit`
- **Body**: 
  - Error type and level
  - Error message
  - Culprit (location/function)
  - Event counts (total and unique users)
  - First and last seen timestamps
  - Direct link to view the issue in Sentry

## Troubleshooting

### "Missing required environment variables"
Make sure your `.env` file exists and contains all required variables.

### "Error fetching Sentry issues"
- Verify your `SENTRY_AUTH_TOKEN` is valid
- Check that `SENTRY_ORG` and `SENTRY_PROJECT` are correct
- Ensure your token has the necessary permissions

### "Error creating GitHub issue"
- Verify your `GITHUB_TOKEN` is valid and has repo access
- Check that `GITHUB_REPO` is in the correct format (owner/repo)
- Ensure your token has the `repo` scope enabled

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.