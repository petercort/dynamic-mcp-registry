/**
 * MCP Server Registry Data
 * Contains the catalog of available MCP servers for Azure API Center deployment
 */

export const mcpServers = [
  {
    id: "github-mcp-server",
    name: "GitHub MCP Server",
    description: "Official GitHub MCP server for GitHub API integration",
    version: "1.0.0",
    author: "GitHub",
    license: "MIT",
    homepage: "https://github.com/github/github-mcp-server",
    repository: {
      type: "git",
      url: "https://github.com/github/github-mcp-server.git"
    },
    configuration: {
      command: "npx",
      args: ["@github/github-mcp-server"],
      env: {
        GITHUB_TOKEN: "{GITHUB_TOKEN}"
      }
    },
    capabilities: [
      "repository-management",
      "issue-management", 
      "pull-request-management",
      "branch-management",
      "file-management",
      "release-management"
    ],
    tools: [
      {
        name: "get_repository",
        description: "Get detailed information about a specific repository",
        parameters: ["owner", "repo"]
      },
      {
        name: "list_repositories", 
        description: "List repositories for the authenticated user",
        parameters: ["type", "sort"]
      },
      {
        name: "create_repository",
        description: "Create a new GitHub repository", 
        parameters: ["name", "description", "private"]
      },
      {
        name: "list_branches",
        description: "List branches in a repository",
        parameters: ["owner", "repo", "protected", "per_page"]
      },
      {
        name: "create_branch",
        description: "Create a new branch",
        parameters: ["owner", "repo", "branch", "sha"]
      },
      {
        name: "delete_branch", 
        description: "Delete a branch",
        parameters: ["owner", "repo", "branch"]
      },
      {
        name: "create_issue",
        description: "Create a new issue in a repository",
        parameters: ["owner", "repo", "title", "body", "labels"]
      },
      {
        name: "list_issues",
        description: "List issues in a repository", 
        parameters: ["owner", "repo", "state", "labels"]
      },
      {
        name: "create_pull_request",
        description: "Create a new pull request",
        parameters: ["owner", "repo", "title", "head", "base", "body"]
      },
      {
        name: "merge_pull_request",
        description: "Merge a pull request",
        parameters: ["owner", "repo", "pull_number", "commit_title", "commit_message", "merge_method"]
      },
      {
        name: "update_file",
        description: "Create or update a file in a repository",
        parameters: ["owner", "repo", "path", "message", "content", "sha", "branch"]
      },
      {
        name: "create_release",
        description: "Create a new release", 
        parameters: ["owner", "repo", "tag_name", "name", "body", "draft", "prerelease"]
      }
    ],
    tags: ["github", "version-control", "collaboration", "development"],
    deployment: {
      requirements: {
        node: ">=18.0.0",
        environment: ["GITHUB_TOKEN"]
      },
      docker: {
        image: "node:18-alpine",
        ports: ["3000"]
      }
    },
    documentation: {
      quickstart: "https://github.com/github/github-mcp-server#installation",
      apiReference: "https://github.com/github/github-mcp-server#tools"
    }
  },
  {
    id: "playwright-mcp-server", 
    name: "Playwright MCP Server",
    description: "Browser automation capabilities using Playwright for web testing and automation",
    version: "0.0.39",
    author: "Microsoft Corporation",
    license: "Apache-2.0", 
    homepage: "https://playwright.dev",
    repository: {
      type: "git",
      url: "https://github.com/microsoft/playwright-mcp.git"
    },
    configuration: {
      command: "npx",
      args: ["@playwright/mcp@latest"],
      env: {}
    },
    capabilities: [
      "browser-automation",
      "web-testing",
      "screenshot-capture", 
      "form-interaction",
      "navigation",
      "accessibility-testing"
    ],
    tools: [
      {
        name: "browser_navigate",
        description: "Navigate to a URL",
        parameters: ["url"]
      },
      {
        name: "browser_click",
        description: "Perform click on a web page",
        parameters: ["element", "ref", "doubleClick", "button", "modifiers"]
      },
      {
        name: "browser_type",
        description: "Type text into editable element", 
        parameters: ["element", "ref", "text", "submit", "slowly"]
      },
      {
        name: "browser_snapshot",
        description: "Capture accessibility snapshot of the current page",
        parameters: []
      },
      {
        name: "browser_take_screenshot",
        description: "Take a screenshot of the current page",
        parameters: ["type", "filename", "element", "ref", "fullPage"]
      },
      {
        name: "browser_fill_form",
        description: "Fill multiple form fields",
        parameters: ["fields"]
      },
      {
        name: "browser_select_option",
        description: "Select an option in a dropdown",
        parameters: ["element", "ref", "values"]
      },
      {
        name: "browser_wait_for",
        description: "Wait for text to appear or disappear or a specified time to pass",
        parameters: ["time", "text", "textGone"]
      },
      {
        name: "browser_evaluate",
        description: "Evaluate JavaScript expression on page or element",
        parameters: ["function", "element", "ref"]
      },
      {
        name: "browser_console_messages",
        description: "Returns all console messages",
        parameters: []
      },
      {
        name: "browser_network_requests",
        description: "Returns all network requests since loading the page",
        parameters: []
      },
      {
        name: "browser_tabs",
        description: "List, create, close, or select a browser tab",
        parameters: ["action", "index"]
      }
    ],
    tags: ["playwright", "browser-automation", "testing", "web-scraping", "accessibility"],
    deployment: {
      requirements: {
        node: ">=18.0.0", 
        environment: []
      },
      docker: {
        image: "mcr.microsoft.com/playwright/mcp",
        ports: ["3000"]
      }
    },
    documentation: {
      quickstart: "https://github.com/microsoft/playwright-mcp#getting-started",
      apiReference: "https://github.com/microsoft/playwright-mcp#tools"
    }
  }
];

export default mcpServers;