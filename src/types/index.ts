export interface SentryIssue {
  id: string;
  title: string;
  culprit: string;
  permalink: string;
  level: string;
  status: string;
  count: string;
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
