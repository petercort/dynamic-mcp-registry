import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mcpServersRouter from './routes/mcpServers.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true,
  methods: ['GET', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
}));

// Compression middleware
app.use(compression());

// JSON parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API documentation endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Dynamic MCP Registry API',
    description: 'A dynamic API based registry for MCP servers that can be deployed on Azure API Center',
    version: process.env.npm_package_version || '1.0.0',
    documentation: {
      openapi: '/api/docs',
      health: '/health'
    },
    endpoints: {
      'GET /api/mcp-servers': 'Get all MCP servers',
      'GET /api/mcp-servers/:id': 'Get specific MCP server',
      'GET /api/mcp-servers/:id/config': 'Get MCP server configuration',
      'GET /api/mcp-servers/:id/tools': 'Get MCP server tools'
    },
    examples: {
      'Get all servers': '/api/mcp-servers',
      'Get servers by tag': '/api/mcp-servers?tags=github,automation',
      'Get servers by capability': '/api/mcp-servers?capability=browser',
      'Get GitHub server': '/api/mcp-servers/github-mcp-server',
      'Get Playwright server': '/api/mcp-servers/playwright-mcp-server'
    }
  });
});

// OpenAPI/Swagger documentation endpoint
app.get('/api/docs', (req, res) => {
  const openApiSpec = {
    openapi: '3.0.3',
    info: {
      title: 'Dynamic MCP Registry API',
      description: 'A dynamic API based registry for MCP (Model Context Protocol) servers that can be deployed on Azure API Center',
      version: '1.0.0',
      contact: {
        name: 'Peter Cort',
        url: 'https://github.com/petercort/dynamic-mcp-registry'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `${req.protocol}://${req.get('host')}`,
        description: 'Current API server'
      }
    ],
    paths: {
      '/api/mcp-servers': {
        get: {
          summary: 'Get all MCP servers',
          description: 'Retrieve all available MCP servers in the registry with optional filtering',
          parameters: [
            {
              name: 'tags',
              in: 'query',
              description: 'Filter by comma-separated tags',
              required: false,
              schema: {
                type: 'string',
                example: 'github,automation'
              }
            },
            {
              name: 'capability',
              in: 'query',
              description: 'Filter by specific capability',
              required: false,
              schema: {
                type: 'string',
                example: 'browser-automation'
              }
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Limit number of results (max 100)',
              required: false,
              schema: {
                type: 'integer',
                minimum: 1,
                maximum: 100,
                default: 50
              }
            },
            {
              name: 'offset',
              in: 'query',
              description: 'Offset for pagination',
              required: false,
              schema: {
                type: 'integer',
                minimum: 0,
                default: 0
              }
            }
          ],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                        example: true
                      },
                      data: {
                        type: 'object',
                        properties: {
                          servers: {
                            type: 'array',
                            items: {
                              $ref: '#/components/schemas/MCPServer'
                            }
                          },
                          total: {
                            type: 'integer',
                            example: 2
                          },
                          limit: {
                            type: 'integer',
                            example: 50
                          },
                          offset: {
                            type: 'integer',
                            example: 0
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/mcp-servers/{id}': {
        get: {
          summary: 'Get specific MCP server',
          description: 'Retrieve a specific MCP server by ID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'Unique identifier of the MCP server',
              schema: {
                type: 'string',
                example: 'github-mcp-server'
              }
            }
          ],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                        example: true
                      },
                      data: {
                        type: 'object',
                        properties: {
                          server: {
                            $ref: '#/components/schemas/MCPServer'
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            '404': {
              description: 'MCP server not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error'
                  }
                }
              }
            }
          }
        }
      }
    },
    components: {
      schemas: {
        MCPServer: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the server',
              example: 'github-mcp-server'
            },
            name: {
              type: 'string',
              description: 'Display name of the server',
              example: 'GitHub MCP Server'
            },
            description: {
              type: 'string',
              description: 'Description of the server functionality',
              example: 'Official GitHub MCP server for GitHub API integration'
            },
            version: {
              type: 'string',
              description: 'Current version of the server',
              example: '1.0.0'
            },
            author: {
              type: 'string',
              description: 'Author/organization of the server',
              example: 'GitHub'
            },
            license: {
              type: 'string',
              description: 'License type',
              example: 'MIT'
            },
            configuration: {
              type: 'object',
              description: 'Configuration object for deployment',
              properties: {
                command: {
                  type: 'string',
                  example: 'npx'
                },
                args: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  example: ['@github/github-mcp-server']
                },
                env: {
                  type: 'object',
                  additionalProperties: {
                    type: 'string'
                  },
                  example: {
                    'GITHUB_TOKEN': '{GITHUB_TOKEN}'
                  }
                }
              }
            },
            capabilities: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of server capabilities',
              example: ['repository-management', 'issue-management']
            },
            tools: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    example: 'get_repository'
                  },
                  description: {
                    type: 'string',
                    example: 'Get detailed information about a specific repository'
                  },
                  parameters: {
                    type: 'array',
                    items: {
                      type: 'string'
                    },
                    example: ['owner', 'repo']
                  }
                }
              },
              description: 'Array of available tools/functions'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of tags for categorization',
              example: ['github', 'version-control', 'collaboration']
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'MCP server not found'
                },
                code: {
                  type: 'string',
                  example: 'SERVER_NOT_FOUND'
                }
              }
            }
          }
        }
      }
    }
  };
  
  res.json(openApiSpec);
});

// Mount API routes
app.use('/api/mcp-servers', mcpServersRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Endpoint not found',
      code: 'NOT_FOUND'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Dynamic MCP Registry API is running on port ${PORT}`);
  console.log(`📖 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
  console.log(`📋 MCP Servers: http://localhost:${PORT}/api/mcp-servers`);
});

export default app;