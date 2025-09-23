import { test } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';

test('Basic API structure validation', async () => {
  // Test that our MCP server data structure is valid
  const { mcpServers } = await import('../src/data/mcpServers.js');
  
  assert.ok(Array.isArray(mcpServers), 'mcpServers should be an array');
  assert.strictEqual(mcpServers.length, 2, 'Should have 2 MCP servers');
  
  // Test GitHub MCP server
  const githubServer = mcpServers.find(s => s.id === 'github-mcp-server');
  assert.ok(githubServer, 'GitHub MCP server should exist');
  assert.strictEqual(githubServer.name, 'GitHub MCP Server');
  assert.ok(Array.isArray(githubServer.capabilities), 'Should have capabilities array');
  assert.ok(Array.isArray(githubServer.tools), 'Should have tools array');
  assert.ok(githubServer.configuration, 'Should have configuration object');
  
  // Test Playwright MCP server
  const playwrightServer = mcpServers.find(s => s.id === 'playwright-mcp-server');
  assert.ok(playwrightServer, 'Playwright MCP server should exist');
  assert.strictEqual(playwrightServer.name, 'Playwright MCP Server');
  assert.ok(Array.isArray(playwrightServer.capabilities), 'Should have capabilities array');
  assert.ok(Array.isArray(playwrightServer.tools), 'Should have tools array');
  assert.ok(playwrightServer.configuration, 'Should have configuration object');
});

test('Configuration structure validation', async () => {
  const { mcpServers } = await import('../src/data/mcpServers.js');
  
  mcpServers.forEach(server => {
    assert.ok(server.configuration, `${server.id} should have configuration`);
    assert.ok(server.configuration.command, `${server.id} should have command`);
    assert.ok(Array.isArray(server.configuration.args), `${server.id} should have args array`);
    assert.ok(typeof server.configuration.env === 'object', `${server.id} should have env object`);
  });
});

// Helper function to make HTTP requests
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: data
          });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => reject(new Error('Request timeout')));
  });
}

test('New API v0 endpoints validation', async (t) => {
  // Import and start the server
  const app = await import('../src/index.js');
  
  // Give the server a moment to start
  await new Promise(resolve => setTimeout(resolve, 100));
  
  await t.test('Health endpoint works at /api/v0/health', async () => {
    const response = await makeRequest('/api/v0/health');
    assert.strictEqual(response.statusCode, 200);
    assert.ok(response.data.status);
    assert.strictEqual(response.data.status, 'healthy');
  });
  
  await t.test('Servers list endpoint works at /api/v0/servers', async () => {
    const response = await makeRequest('/api/v0/servers');
    assert.strictEqual(response.statusCode, 200);
    assert.ok(response.data.success);
    assert.ok(Array.isArray(response.data.data.servers));
    assert.strictEqual(response.data.data.servers.length, 2);
    assert.strictEqual(response.data.data.total, 2);
    assert.strictEqual(response.data.data.limit, 50);
    assert.ok('cursor' in response.data.data);
  });
  
  await t.test('Servers list with cursor pagination works', async () => {
    const response = await makeRequest('/api/v0/servers?limit=1');
    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.data.data.servers.length, 1);
    assert.ok(response.data.data.cursor);
    
    // Test second page
    const response2 = await makeRequest(`/api/v0/servers?limit=1&cursor=${response.data.data.cursor}`);
    assert.strictEqual(response2.statusCode, 200);
    assert.strictEqual(response2.data.data.servers.length, 1);
    assert.strictEqual(response2.data.data.cursor, null);
  });
  
  await t.test('Server details endpoint works at /api/v0/servers/:id', async () => {
    const response = await makeRequest('/api/v0/servers/github-mcp-server');
    assert.strictEqual(response.statusCode, 200);
    assert.ok(response.data.success);
    assert.strictEqual(response.data.data.server.id, 'github-mcp-server');
  });
  
  await t.test('Server details with version parameter works', async () => {
    const response = await makeRequest('/api/v0/servers/github-mcp-server?version=2.0.0');
    assert.strictEqual(response.statusCode, 200);
    assert.ok(response.data.data.server.versionNote);
    assert.ok(response.data.data.server.versionNote.includes('2.0.0'));
  });
  
  await t.test('Old endpoints return 404', async () => {
    const response1 = await makeRequest('/health');
    assert.strictEqual(response1.statusCode, 404);
    
    const response2 = await makeRequest('/api/mcp-servers');
    assert.strictEqual(response2.statusCode, 404);
  });
});