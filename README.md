# Dynamic MCP Registry

A dynamic API based registry for MCP (Model Context Protocol) servers that can be deployed on Azure API Center.
dddd
## Overview

This API provides a centralized registry of Model Context Protocol servers, making it easy to discover and deploy MCP servers for use with AI assistants like Claude, GitHub Copilot, and other LLM applications.

## Features

- **RESTful API** for MCP server discovery
- **Filtering and pagination** support
- **OpenAPI/Swagger documentation**
- **Azure API Center compatible**
- **Docker support** for easy deployment
- **Security best practices** with helmet.js and CORS
- **Health checks** for monitoring

## Included MCP Servers

### GitHub MCP Server
- **ID**: `github-mcp-server`
- **Description**: Official GitHub MCP server for GitHub API integration
- **Capabilities**: Repository management, issue management, pull request management, branch management, file management, release management
- **Tools**: 12 tools for comprehensive GitHub operations

### Playwright MCP Server  
- **ID**: `playwright-mcp-server`
- **Description**: Browser automation capabilities using Playwright
- **Capabilities**: Browser automation, web testing, screenshot capture, form interaction, navigation, accessibility testing
- **Tools**: 12+ tools for web browser automation

## API Endpoints

### Get All MCP Servers
```
GET /api/mcp-servers
```

Query parameters:
- `tags` - Filter by comma-separated tags
- `capability` - Filter by specific capability  
- `limit` - Limit number of results (max 100, default 50)
- `offset` - Offset for pagination (default 0)

### Get Specific MCP Server
```
GET /api/mcp-servers/{id}
```

### Get MCP Server Configuration
```
GET /api/mcp-servers/{id}/config
```

### Get MCP Server Tools
```
GET /api/mcp-servers/{id}/tools
```

### Health Check
```
GET /health
```

### API Documentation
```
GET /api/docs
```

## Quick Start

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/petercort/dynamic-mcp-registry.git
cd dynamic-mcp-registry
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Visit the API documentation:
```
http://localhost:3000/api/docs
```

### Using the API

Get all MCP servers:
```bash
curl http://localhost:3000/api/mcp-servers
```

Get servers by tag:
```bash
curl "http://localhost:3000/api/mcp-servers?tags=github,automation"
```

Get a specific server:
```bash
curl http://localhost:3000/api/mcp-servers/github-mcp-server
```

Get server configuration:
```bash
curl http://localhost:3000/api/mcp-servers/github-mcp-server/config
```

## Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

## MCP Server Schema

Each MCP server includes:

- **Basic Information**: id, name, description, version, author, license
- **Repository**: Git repository information
- **Configuration**: Deployment command, arguments, environment variables
- **Capabilities**: Array of server capabilities
- **Tools**: Available tools with descriptions and parameters
- **Tags**: Categorization tags
- **Deployment**: Requirements and Docker configuration
- **Documentation**: Links to quickstart and API reference

## Deployment

### Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `ALLOWED_ORIGINS` - Comma-separated allowed CORS origins

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
EXPOSE 3000
CMD ["npm", "start"]
```

### Azure API Center

This API is designed to be compatible with Azure API Center for enterprise deployment and management.

## Testing

Run tests:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please open an issue on the GitHub repository.
