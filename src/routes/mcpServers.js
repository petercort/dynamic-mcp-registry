import express from 'express';
import { mcpServers } from '../data/mcpServers.js';

const router = express.Router();

/**
 * @api {get} /api/v0/servers Get all MCP servers
 * @apiName GetMCPServers
 * @apiGroup MCPServers
 * @apiDescription Retrieve all available MCP servers in the registry
 * 
 * @apiParam {String} [tags] Filter by comma-separated tags
 * @apiParam {String} [capability] Filter by specific capability
 * @apiParam {Number} [limit] Limit number of results (default: 50)
 * @apiParam {String} [cursor] Cursor for pagination
 * 
 * @apiSuccess {Object[]} servers Array of MCP server definitions
 * @apiSuccess {String} servers.id Unique identifier for the server
 * @apiSuccess {String} servers.name Display name of the server
 * @apiSuccess {String} servers.description Description of the server functionality
 * @apiSuccess {String} servers.version Current version of the server
 * @apiSuccess {String} servers.author Author/organization of the server
 * @apiSuccess {String} servers.license License type
 * @apiSuccess {Object} servers.configuration Configuration object for deployment
 * @apiSuccess {String[]} servers.capabilities Array of server capabilities
 * @apiSuccess {Object[]} servers.tools Array of available tools/functions
 * @apiSuccess {String[]} servers.tags Array of tags for categorization
 * @apiSuccess {Object} servers.deployment Deployment requirements and configuration
 * 
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "data": {
 *         "servers": [...],
 *         "total": 2,
 *         "limit": 50,
 *         "cursor": null
 *       }
 *     }
 */
router.get('/', (req, res) => {
  try {
    let filteredServers = [...mcpServers];
    
    // Filter by tags
    if (req.query.tags) {
      const filterTags = req.query.tags.split(',').map(tag => tag.trim().toLowerCase());
      filteredServers = filteredServers.filter(server => 
        server.tags.some(tag => filterTags.includes(tag.toLowerCase()))
      );
    }
    
    // Filter by capability
    if (req.query.capability) {
      const capability = req.query.capability.toLowerCase();
      filteredServers = filteredServers.filter(server =>
        server.capabilities.some(cap => cap.toLowerCase().includes(capability))
      );
    }
    
    // Pagination with cursor support
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const cursor = req.query.cursor || null;
    const total = filteredServers.length;
    
    // For simplicity, implementing cursor as base64 encoded offset
    // In production, this would be a more sophisticated cursor implementation
    let offset = 0;
    if (cursor) {
      try {
        offset = parseInt(Buffer.from(cursor, 'base64').toString());
      } catch (e) {
        offset = 0;
      }
    }
    
    const paginatedServers = filteredServers.slice(offset, offset + limit);
    
    // Generate next cursor
    const nextOffset = offset + limit;
    const nextCursor = nextOffset < total ? Buffer.from(nextOffset.toString()).toString('base64') : null;
    
    res.json({
      success: true,
      data: {
        servers: paginatedServers,
        total,
        limit,
        cursor: nextCursor
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        details: error.message
      }
    });
  }
});

/**
 * @api {get} /api/v0/servers/:id Get specific MCP server
 * @apiName GetMCPServer
 * @apiGroup MCPServers
 * @apiDescription Retrieve a specific MCP server by ID
 * 
 * @apiParam {String} id Unique identifier of the MCP server
 * @apiParam {String} [version] Specific version of the MCP server
 * 
 * @apiSuccess {Object} server MCP server definition
 * @apiSuccess {String} server.id Unique identifier for the server
 * @apiSuccess {String} server.name Display name of the server
 * @apiSuccess {String} server.description Description of the server functionality
 * @apiSuccess {String} server.version Current version of the server
 * @apiSuccess {String} server.author Author/organization of the server
 * @apiSuccess {String} server.license License type
 * @apiSuccess {Object} server.configuration Configuration object for deployment
 * @apiSuccess {String[]} server.capabilities Array of server capabilities
 * @apiSuccess {Object[]} server.tools Array of available tools/functions
 * @apiSuccess {String[]} server.tags Array of tags for categorization
 * @apiSuccess {Object} server.deployment Deployment requirements and configuration
 * 
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "data": {
 *         "server": {...}
 *       }
 *     }
 * 
 * @apiError ServerNotFound The MCP server with the given ID was not found
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "success": false,
 *       "error": {
 *         "message": "MCP server not found",
 *         "code": "SERVER_NOT_FOUND"
 *       }
 *     }
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const requestedVersion = req.query.version;
    const server = mcpServers.find(s => s.id === id);
    
    if (!server) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'MCP server not found',
          code: 'SERVER_NOT_FOUND'
        }
      });
    }
    
    // If a specific version is requested, check if it matches
    // For now, just add a warning if version doesn't match current version
    let responseServer = { ...server };
    if (requestedVersion && requestedVersion !== server.version) {
      responseServer.versionNote = `Requested version ${requestedVersion} not available. Returning current version ${server.version}.`;
    }
    
    res.json({
      success: true,
      data: {
        server: responseServer
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        details: error.message
      }
    });
  }
});

/**
 * @api {get} /api/mcp-servers/:id/config Get MCP server configuration
 * @apiName GetMCPServerConfig
 * @apiGroup MCPServers
 * @apiDescription Get the deployment configuration for a specific MCP server
 * 
 * @apiParam {String} id Unique identifier of the MCP server
 * @apiParam {String} [format=json] Configuration format (json, yaml, toml)
 * 
 * @apiSuccess {Object} configuration MCP server configuration
 * @apiSuccess {String} configuration.command Command to run the server
 * @apiSuccess {String[]} configuration.args Command arguments
 * @apiSuccess {Object} configuration.env Environment variables
 * 
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "data": {
 *         "configuration": {
 *           "command": "npx",
 *           "args": ["@github/github-mcp-server"],
 *           "env": {
 *             "GITHUB_TOKEN": "{GITHUB_TOKEN}"
 *           }
 *         }
 *       }
 *     }
 */
router.get('/:id/config', (req, res) => {
  try {
    const { id } = req.params;
    const server = mcpServers.find(s => s.id === id);
    
    if (!server) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'MCP server not found',
          code: 'SERVER_NOT_FOUND'
        }
      });
    }
    
    const format = req.query.format || 'json';
    
    if (format === 'json') {
      res.json({
        success: true,
        data: {
          configuration: server.configuration
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: {
          message: 'Unsupported format. Only json is currently supported.',
          code: 'UNSUPPORTED_FORMAT'
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        details: error.message
      }
    });
  }
});

/**
 * @api {get} /api/mcp-servers/:id/tools Get MCP server tools
 * @apiName GetMCPServerTools
 * @apiGroup MCPServers
 * @apiDescription Get the available tools for a specific MCP server
 * 
 * @apiParam {String} id Unique identifier of the MCP server
 * 
 * @apiSuccess {Object[]} tools Array of available tools
 * @apiSuccess {String} tools.name Tool name
 * @apiSuccess {String} tools.description Tool description
 * @apiSuccess {String[]} tools.parameters Tool parameters
 * 
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "data": {
 *         "tools": [...]
 *       }
 *     }
 */
router.get('/:id/tools', (req, res) => {
  try {
    const { id } = req.params;
    const server = mcpServers.find(s => s.id === id);
    
    if (!server) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'MCP server not found',
          code: 'SERVER_NOT_FOUND'
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        tools: server.tools
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        details: error.message
      }
    });
  }
});

export default router;