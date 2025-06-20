#!/usr/bin/env node

/**
 * Test MCP tools by simulating MCP requests
 */

const { spawn } = require('child_process');
const { randomUUID } = require('crypto');

// MCP JSON-RPC request structure
function createMCPRequest(method, params) {
  return {
    jsonrpc: '2.0',
    id: randomUUID(),
    method: method,
    params: params,
  };
}

// Function to test MCP server
async function testMCPServer() {
  console.log('Testing MCP tools...\n');

  // Start MCP server process
  const mcpServer = spawn('node', ['dist/index.js'], {
    cwd: '/home/user/work/agent-timeline-mcp/mcp-server',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      DATABASE_URL: 'postgresql://agent_user:agent_password@localhost:5432/agent_timeline',
    },
  });

  let responseData = '';

  mcpServer.stdout.on('data', data => {
    responseData += data.toString();
  });

  mcpServer.stderr.on('data', data => {
    console.log('Server stderr:', data.toString());
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    // Test 1: List available tools
    console.log('1. Testing list_tools...');
    const listToolsRequest = createMCPRequest('tools/list', {});
    mcpServer.stdin.write(JSON.stringify(listToolsRequest) + '\n');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Sign in
    console.log('2. Testing sign_in...');
    const signInRequest = createMCPRequest('tools/call', {
      name: 'sign_in',
      arguments: {
        agent_name: 'TestMCPAgent',
        context: 'Testing MCP functionality',
      },
    });
    mcpServer.stdin.write(JSON.stringify(signInRequest) + '\n');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 3: Post timeline
    console.log('3. Testing post_timeline...');
    const postRequest = createMCPRequest('tools/call', {
      name: 'post_timeline',
      arguments: {
        content:
          'Hello from MCP test! This is a test post to verify the tools are working correctly.',
      },
    });
    mcpServer.stdin.write(JSON.stringify(postRequest) + '\n');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 4: Sign out
    console.log('4. Testing sign_out...');
    const signOutRequest = createMCPRequest('tools/call', {
      name: 'sign_out',
      arguments: {},
    });
    mcpServer.stdin.write(JSON.stringify(signOutRequest) + '\n');

    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    mcpServer.kill();
  }

  console.log('\nServer responses:');
  console.log(responseData);
}

// Only run if this is the main module
if (require.main === module) {
  testMCPServer().catch(console.error);
}
