import express from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mcpServersRouter from './routes/mcpServers.js';

const app = express();
const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;
const USE_HTTPS = process.env.USE_HTTPS === 'true' || process.env.NODE_ENV === 'development';

// Security middleware
const connectSrcSources = ["'self'", "https:", "ws:"];

// Add localhost for development
if (process.env.NODE_ENV !== 'production') {
  connectSrcSources.push("http://localhost:3000", "http://localhost:*", "https://localhost:*");
}

// Add any additional allowed sources from environment variable
if (process.env.CSP_CONNECT_SRC) {
  connectSrcSources.push(...process.env.CSP_CONNECT_SRC.split(','));
}

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: connectSrcSources,
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
app.get('/api/v0/health', (req, res) => {
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
      health: '/api/v0/health'
    },
    endpoints: {
      'GET /api/v0/servers': 'Get all MCP servers',
      'GET /api/v0/servers/:id': 'Get specific MCP server',
      'GET /api/mcp-servers/:id/config': 'Get MCP server configuration',
      'GET /api/mcp-servers/:id/tools': 'Get MCP server tools'
    },
    examples: {
      'Get all servers': '/api/v0/servers',
      'Get servers by tag': '/api/v0/servers?tags=github,automation',
      'Get servers by capability': '/api/v0/servers?capability=browser',
      'Get GitHub server': '/api/v0/servers/github-mcp-server',
      'Get Playwright server': '/api/v0/servers/playwright-mcp-server'
    }
  });
});

// OpenAPI/Swagger documentation endpoint
app.get('/api/docs', (req, res) => {
  const baseUrl = req.secure || req.headers['x-forwarded-proto'] === 'https' 
    ? `https://${req.get('host')}`
    : `${req.protocol}://${req.get('host')}`;
    
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
        url: baseUrl,
        description: 'Current API server'
      }
    ],
    paths: {
      '/api/v0/servers': {
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
              name: 'cursor',
              in: 'query',
              description: 'Cursor for pagination',
              required: false,
              schema: {
                type: 'string'
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
                          cursor: {
                            type: 'string',
                            example: null
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
      '/api/v0/servers/{id}': {
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
            },
            {
              name: 'version',
              in: 'query',
              required: false,
              description: 'Specific version of the MCP server',
              schema: {
                type: 'string',
                example: '1.0.0'
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
app.use('/api/v0/servers', mcpServersRouter);

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

// Function to start HTTP server
function startHttpServer() {
  app.listen(PORT, () => {
    console.log(`🚀 Dynamic MCP Registry API (HTTP) is running on port ${PORT}`);
    console.log(`📖 API Documentation: http://localhost:${PORT}/api/docs`);
    console.log(`🔍 Health Check: http://localhost:${PORT}/api/v0/health`);
    console.log(`📋 MCP Servers: http://localhost:${PORT}/api/v0/servers`);
  });
}

// Function to start HTTPS server
function startHttpsServer() {
  const certsPath = path.join(process.cwd(), 'certs');
  const keyPath = path.join(certsPath, 'key.pem');
  const certPath = path.join(certsPath, 'cert.pem');

  // Check if certificates exist
  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.log('⚠️  SSL certificates not found. Run: node scripts/generate-certs.js');
    console.log('📁 Certificates should be at:', certsPath);
    console.log('🔄 Falling back to HTTP server...\n');
    startHttpServer();
    return;
  }

  try {
    const options = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };

    https.createServer(options, app).listen(HTTPS_PORT, () => {
      console.log(`🚀 Dynamic MCP Registry API (HTTPS) is running on port ${HTTPS_PORT}`);
      console.log(`📖 API Documentation: https://localhost:${HTTPS_PORT}/api/docs`);
      console.log(`🔍 Health Check: https://localhost:${HTTPS_PORT}/api/v0/health`);
      console.log(`📋 MCP Servers: https://localhost:${HTTPS_PORT}/api/v0/servers`);
      console.log(`🔒 Using self-signed certificate (browsers will show warning)`);
    });

    // Also start HTTP server for redirect
    http.createServer((req, res) => {
      res.writeHead(301, { Location: `https://localhost:${HTTPS_PORT}${req.url}` });
      res.end();
    }).listen(PORT, () => {
      console.log(`🔄 HTTP redirect server running on port ${PORT} -> HTTPS ${HTTPS_PORT}`);
    });

  } catch (error) {
    console.error('❌ Error starting HTTPS server:', error.message);
    console.log('🔄 Falling back to HTTP server...\n');
    startHttpServer();
  }
}

// Start the appropriate server
if (USE_HTTPS) {
  startHttpsServer();
} else {
  startHttpServer();
}

export default app;