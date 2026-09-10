import type { McpServerSnapshot } from './types'
import { hoursAgo, minutesAgo } from './clock'

/** The MCP servers Younes connected — the engineering stack's official remotes. */
export const MCP_SERVERS: McpServerSnapshot[] = [
  {
    id: 'mcp_github',
    name: 'GitHub',
    slug: 'github',
    transport: 'http',
    target: 'https://api.githubcopilot.com/mcp/',
    enabled: true,
    state: 'connected',
    toolCount: 14,
    toolNames: [
      'list_pull_requests',
      'get_pull_request',
      'get_pull_request_diff',
      'create_pull_request',
      'list_issues',
      'get_issue',
      'create_issue',
      'add_issue_comment',
      'search_code',
      'get_file_contents',
      'list_commits',
      'list_workflow_runs',
      'get_workflow_run_logs',
      'search_repositories'
    ],
    headers: [{ key: 'Authorization', value: 'Bearer ghp_9uT7…kq2', sensitive: true }],
    serverName: 'github-mcp-server',
    serverVersion: '0.14.1',
    lastConnectedAt: minutesAgo(12)
  },
  {
    id: 'mcp_atlassian',
    name: 'Jira & Confluence',
    slug: 'atlassian',
    transport: 'http',
    target: 'https://mcp.atlassian.com/v1/sse',
    enabled: true,
    state: 'connected',
    toolCount: 11,
    toolNames: [
      'searchJiraIssuesUsingJql',
      'getJiraIssue',
      'createJiraIssue',
      'editJiraIssue',
      'transitionJiraIssue',
      'addCommentToJiraIssue',
      'getJiraSprint',
      'searchConfluenceUsingCql',
      'getConfluencePage',
      'createConfluencePage',
      'updateConfluencePage'
    ],
    serverName: 'atlassian-remote-mcp',
    serverVersion: '2.3.0',
    lastConnectedAt: minutesAgo(12)
  },
  {
    id: 'mcp_sentry',
    name: 'Sentry',
    slug: 'sentry',
    transport: 'http',
    target: 'https://mcp.sentry.dev/mcp',
    enabled: true,
    state: 'needs-auth',
    toolCount: 0,
    toolNames: [],
    serverName: 'sentry-mcp',
    serverVersion: '0.9.4',
    error: 'OAuth token expired — authorize again to reconnect.',
    lastConnectedAt: hoursAgo(31)
  },
  {
    id: 'mcp_postgres',
    name: 'Postgres (staging)',
    slug: 'postgres-staging',
    transport: 'stdio',
    target: 'npx -y @modelcontextprotocol/server-postgres postgresql://readonly@staging-db.internal:5432/wolffish',
    enabled: false,
    state: 'disabled',
    toolCount: 1,
    toolNames: ['query'],
    serverName: 'postgres-mcp',
    serverVersion: '0.6.2',
    lastConnectedAt: hoursAgo(80)
  }
]
