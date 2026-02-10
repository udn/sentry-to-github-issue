export interface SentryIssue {
  id: string;
  title: string;
  culprit: string;
  permalink: string;
  level: string;
  status: string;
  count: number;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  metadata: {
    type?: string;
    value?: string;
  };
}

export interface GitHubIssue {
  title: string;
  body: string;
  labels?: string[];
}

export interface SentryToGitHubConfig {
  sentryDsn: string;
  sentryAuthToken: string;
  sentryOrg: string;
  sentryProject: string;
  githubToken: string;
  githubOwner: string;
  githubRepo: string;
}

export interface GetSentryIssuesArgs {
  limit?: number;
  query?: string;
}

export interface GetSentryIssueDetailsArgs {
  issueId: string;
}

export interface CreateGitHubIssueArgs {
  title: string;
  body: string;
  labels?: string[];
}

export interface ListGitHubIssuesArgs {
  state?: string;
  labels?: string;
}

export interface SearchGitHubIssuesArgs {
  query: string;
}
