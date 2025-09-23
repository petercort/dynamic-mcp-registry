import { test } from 'node:test';
import assert from 'node:assert';

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