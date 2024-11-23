import { Hono } from 'hono'
import { config } from '../../../config.env'
import { Octokit } from '@octokit/rest'

const issueRouter = new Hono()
const octokit = new Octokit({ auth: config.GITHUB_ACCESS_TOKEN })

async function fetchGithubIssues(owner: string, repo: string) {
  try {
    const { data: issues } = await octokit.issues.listForRepo({
      owner,
      repo,
      state: 'all',
      per_page: 100,
    })
    return issues
  } catch (error) {
    console.error('Error fetching GitHub issues:', error)
    throw error
  }
}

// Get all issues
issueRouter.get('/:owner/:repo', async (c) => {
  try {
    const owner = c.req.param('owner')
    const repo = c.req.param('repo')
    const issues = await fetchGithubIssues(owner, repo)
    
    const formattedIssues = issues.map(issue => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      description: issue.body,
      state: issue.state,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      closedAt: issue.closed_at,
      labels: issue.labels,
      assignees: issue.assignees,
      url: issue.html_url
    }))

    return c.json({ issues: formattedIssues })
  } catch (error) {
    console.error('Error fetching issues:', error)
    return c.json({ error: 'Failed to fetch issues' }, 500)
  }
})

// Get open issues created in the last 7 days
issueRouter.get('/:owner/:repo/recent', async (c) => {
  try {
    const owner = c.req.param('owner')
    const repo = c.req.param('repo')
    const issues = await fetchGithubIssues(owner, repo)
    
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentIssues = issues.filter(issue => {
      const createdAt = new Date(issue.created_at)
      return createdAt >= sevenDaysAgo && issue.state === 'open'
    }).map(issue => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      description: issue.body,
      state: issue.state,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      labels: issue.labels,
      assignees: issue.assignees,
      url: issue.html_url
    }))

    return c.json({ 
      issues: recentIssues,
      debug: {
        totalIssues: issues.length,
        filteredIssues: recentIssues.length,
        since: sevenDaysAgo.toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching recent issues:', error)
    return c.json({ error: 'Failed to fetch recent issues' }, 500)
  }
})

// Get single issue
issueRouter.get('/:owner/:repo/issue/:number', async (c) => {
  try {
    const owner = c.req.param('owner')
    const repo = c.req.param('repo')
    const number = parseInt(c.req.param('number'))

    const { data: issue } = await octokit.issues.get({
      owner,
      repo,
      issue_number: number
    })

    return c.json({ 
      issue: {
        id: issue.id,
        number: issue.number,
        title: issue.title,
        description: issue.body,
        state: issue.state,
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        closedAt: issue.closed_at,
        labels: issue.labels,
        assignees: issue.assignees,
        url: issue.html_url
      }
    })
  } catch (error) {
    console.error('Error fetching issue:', error)
    return c.json({ error: 'Failed to fetch issue' }, 500)
  }
})

export default issueRouter