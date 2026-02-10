#!/usr/bin/env python3
"""
Sentry to GitHub Issue Creator

This script fetches issues from Sentry and creates corresponding GitHub issues.
"""

import os
import sys
import argparse
import requests
from typing import Dict, List, Optional, Tuple
from dotenv import load_dotenv


# Constants
SEPARATOR_WIDTH = 60

class SentryClient:
    """Client for interacting with Sentry API"""
    
    def __init__(self, auth_token: str, org: str, project: str, api_url: str = "https://sentry.io/api/0"):
        self.auth_token = auth_token
        self.org = org
        self.project = project
        self.api_url = api_url.rstrip('/')
        self.headers = {
            'Authorization': f'Bearer {auth_token}',
            'Content-Type': 'application/json'
        }
    
    def get_issues(self, query: str = "", limit: int = 10) -> List[Dict]:
        """
        Fetch issues from Sentry
        
        Args:
            query: Optional query string to filter issues
            limit: Maximum number of issues to fetch
            
        Returns:
            List of Sentry issues
        """
        url = f"{self.api_url}/projects/{self.org}/{self.project}/issues/"
        params = {
            'query': query,
            'limit': limit,
            'statsPeriod': '14d'
        }
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching Sentry issues: {e}")
            sys.exit(1)
    
    def get_issue_details(self, issue_id: str) -> Dict:
        """
        Fetch detailed information about a specific Sentry issue
        
        Args:
            issue_id: Sentry issue ID
            
        Returns:
            Detailed issue information
        """
        url = f"{self.api_url}/issues/{issue_id}/"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching Sentry issue details: {e}")
            sys.exit(1)


class GitHubClient:
    """Client for interacting with GitHub API"""
    
    def __init__(self, token: str, repo: str):
        self.token = token
        self.repo = repo
        self.headers = {
            'Authorization': f'token {token}',
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        }
        self.api_url = "https://api.github.com"
    
    def create_issue(self, title: str, body: str, labels: Optional[List[str]] = None) -> Dict:
        """
        Create a GitHub issue
        
        Args:
            title: Issue title
            body: Issue body (description)
            labels: Optional list of labels to add
            
        Returns:
            Created issue data
        """
        url = f"{self.api_url}/repos/{self.repo}/issues"
        payload = {
            'title': title,
            'body': body
        }
        
        if labels:
            payload['labels'] = labels
        
        try:
            response = requests.post(url, headers=self.headers, json=payload)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error creating GitHub issue: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response: {e.response.text}")
            sys.exit(1)
    
    def issue_exists(self, title: str) -> bool:
        """
        Check if an issue with the given title already exists
        
        Args:
            title: Issue title to search for
            
        Returns:
            True if issue exists, False otherwise
        """
        url = f"{self.api_url}/search/issues"
        query = f'repo:{self.repo} is:issue "{title}"'
        params = {'q': query}
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            data = response.json()
            return data.get('total_count', 0) > 0
        except requests.exceptions.RequestException as e:
            print(f"Error checking existing GitHub issues: {e}")
            return False


def format_github_issue(sentry_issue: Dict) -> Tuple[str, str]:
    """
    Format Sentry issue data into GitHub issue format
    
    Args:
        sentry_issue: Sentry issue data
        
    Returns:
        Tuple of (title, body) for GitHub issue
    """
    # Extract key information
    title_prefix = "[Sentry]"
    error_type = sentry_issue.get('type', 'Error')
    culprit = sentry_issue.get('culprit', 'Unknown')
    title = f"{title_prefix} {error_type}: {culprit}"
    
    # Build issue body
    permalink = sentry_issue.get('permalink', 'N/A')
    count = sentry_issue.get('count', 'N/A')
    user_count = sentry_issue.get('userCount', 'N/A')
    first_seen = sentry_issue.get('firstSeen', 'N/A')
    last_seen = sentry_issue.get('lastSeen', 'N/A')
    level = sentry_issue.get('level', 'N/A')
    
    # Get the latest event message
    metadata = sentry_issue.get('metadata', {})
    message = metadata.get('value', metadata.get('title', 'No message available'))
    
    body = f"""## Sentry Issue

**Error Type:** {error_type}
**Level:** {level}
**Message:** {message}

### Details
- **Culprit:** {culprit}
- **Count:** {count}
- **User Count:** {user_count}
- **First Seen:** {first_seen}
- **Last Seen:** {last_seen}

### Links
- [View in Sentry]({permalink})

---
*This issue was automatically created from Sentry*
"""
    
    return title, body


def main():
    """Main function"""
    # Load environment variables
    load_dotenv()
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(
        description='Fetch Sentry issues and create GitHub issues'
    )
    parser.add_argument(
        '--issue-id',
        help='Specific Sentry issue ID to fetch',
        type=str
    )
    parser.add_argument(
        '--query',
        help='Query string to filter Sentry issues',
        type=str,
        default=''
    )
    parser.add_argument(
        '--limit',
        help='Maximum number of issues to fetch (default: 10)',
        type=int,
        default=10
    )
    parser.add_argument(
        '--labels',
        help='Comma-separated list of labels to add to GitHub issues',
        type=str,
        default='sentry'
    )
    parser.add_argument(
        '--skip-existing',
        help='Skip creating issues if they already exist in GitHub',
        action='store_true'
    )
    
    args = parser.parse_args()
    
    # Get configuration from environment
    sentry_token = os.getenv('SENTRY_AUTH_TOKEN')
    sentry_org = os.getenv('SENTRY_ORG')
    sentry_project = os.getenv('SENTRY_PROJECT')
    sentry_api_url = os.getenv('SENTRY_API_URL', 'https://sentry.io/api/0/')
    github_token = os.getenv('GITHUB_TOKEN')
    github_repo = os.getenv('GITHUB_REPO')
    
    # Validate configuration
    if not all([sentry_token, sentry_org, sentry_project, github_token, github_repo]):
        print("Error: Missing required environment variables")
        print("Please ensure the following are set:")
        print("  - SENTRY_AUTH_TOKEN")
        print("  - SENTRY_ORG")
        print("  - SENTRY_PROJECT")
        print("  - GITHUB_TOKEN")
        print("  - GITHUB_REPO")
        sys.exit(1)
    
    # Initialize clients
    sentry = SentryClient(sentry_token, sentry_org, sentry_project, sentry_api_url)
    github = GitHubClient(github_token, github_repo)
    
    # Parse labels
    labels = [label.strip() for label in args.labels.split(',')] if args.labels else []
    
    # Fetch issues
    if args.issue_id:
        print(f"Fetching Sentry issue: {args.issue_id}")
        issues = [sentry.get_issue_details(args.issue_id)]
    else:
        print(f"Fetching Sentry issues (limit: {args.limit}, query: '{args.query}')")
        issues = sentry.get_issues(query=args.query, limit=args.limit)
    
    print(f"Found {len(issues)} Sentry issue(s)")
    
    # Create GitHub issues
    created_count = 0
    skipped_count = 0
    
    for issue in issues:
        title, body = format_github_issue(issue)
        
        # Check if issue already exists
        if args.skip_existing and github.issue_exists(title):
            print(f"⏭️  Skipping (already exists): {title}")
            skipped_count += 1
            continue
        
        print(f"Creating GitHub issue: {title}")
        gh_issue = github.create_issue(title, body, labels)
        print(f"✅ Created: {gh_issue['html_url']}")
        created_count += 1
    
    # Summary
    print(f"\n{'=' * SEPARATOR_WIDTH}")
    print(f"Summary:")
    print(f"  Created: {created_count}")
    print(f"  Skipped: {skipped_count}")
    print(f"  Total:   {len(issues)}")
    print(f"{'=' * SEPARATOR_WIDTH}")


if __name__ == '__main__':
    main()
