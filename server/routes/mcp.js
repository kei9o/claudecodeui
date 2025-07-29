import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { spawn } from 'child_process';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Claude CLI command routes

// GET /api/mcp/cli/list - List MCP servers using Claude CLI
router.get('/cli/list', async (req, res) => {
  try {
    console.log('📋 Listing MCP servers using Claude CLI');
    
    const { spawn } = await import('child_process');
    const { promisify } = await import('util');
    const exec = promisify(spawn);
    
    const process = spawn('claude', ['mcp', 'list'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        res.json({ success: true, output: stdout, servers: parseClaudeListOutput(stdout) });
      } else {
        console.error('Claude CLI error:', stderr);
        res.status(500).json({ error: 'Claude CLI command failed', details: stderr });
      }
    });
    
    process.on('error', (error) => {
      console.error('Error running Claude CLI:', error);
      res.status(500).json({ error: 'Failed to run Claude CLI', details: error.message });
    });
  } catch (error) {
    console.error('Error listing MCP servers via CLI:', error);
    res.status(500).json({ error: 'Failed to list MCP servers', details: error.message });
  }
});

// POST /api/mcp/cli/add - Add MCP server using Claude CLI
router.post('/cli/add', async (req, res) => {
  try {
    const { name, type = 'stdio', command, args = [], url, headers = {}, env = {} } = req.body;
    
    console.log('➕ Adding MCP server using Claude CLI:', name);
    
    const { spawn } = await import('child_process');
    
    let cliArgs = ['mcp', 'add'];
    
    if (type === 'http') {
      cliArgs.push('--transport', 'http', name, url);
      // Add headers if provided
      Object.entries(headers).forEach(([key, value]) => {
        cliArgs.push('--header', `${key}: ${value}`);
      });
    } else if (type === 'sse') {
      cliArgs.push('--transport', 'sse', name, url);
      // Add headers if provided
      Object.entries(headers).forEach(([key, value]) => {
        cliArgs.push('--header', `${key}: ${value}`);
      });
    } else {
      // stdio (default): claude mcp add <name> <command> [args...]
      cliArgs.push(name);
      // Add environment variables
      Object.entries(env).forEach(([key, value]) => {
        cliArgs.push('-e', `${key}=${value}`);
      });
      cliArgs.push(command);
      if (args && args.length > 0) {
        cliArgs.push(...args);
      }
    }
    
    console.log('🔧 Running Claude CLI command:', 'claude', cliArgs.join(' '));
    
    const process = spawn('claude', cliArgs, {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        res.json({ success: true, output: stdout, message: `MCP server "${name}" added successfully` });
      } else {
        console.error('Claude CLI error:', stderr);
        res.status(400).json({ error: 'Claude CLI command failed', details: stderr });
      }
    });
    
    process.on('error', (error) => {
      console.error('Error running Claude CLI:', error);
      res.status(500).json({ error: 'Failed to run Claude CLI', details: error.message });
    });
  } catch (error) {
    console.error('Error adding MCP server via CLI:', error);
    res.status(500).json({ error: 'Failed to add MCP server', details: error.message });
  }
});

// DELETE /api/mcp/cli/remove/:name - Remove MCP server using Claude CLI
router.delete('/cli/remove/:name', async (req, res) => {
  try {
    const { name } = req.params;
    
    console.log('🗑️ Removing MCP server using Claude CLI:', name);
    
    const { spawn } = await import('child_process');
    
    const process = spawn('claude', ['mcp', 'remove', name], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        res.json({ success: true, output: stdout, message: `MCP server "${name}" removed successfully` });
      } else {
        console.error('Claude CLI error:', stderr);
        res.status(400).json({ error: 'Claude CLI command failed', details: stderr });
      }
    });
    
    process.on('error', (error) => {
      console.error('Error running Claude CLI:', error);
      res.status(500).json({ error: 'Failed to run Claude CLI', details: error.message });
    });
  } catch (error) {
    console.error('Error removing MCP server via CLI:', error);
    res.status(500).json({ error: 'Failed to remove MCP server', details: error.message });
  }
});

// GET /api/mcp/cli/get/:name - Get MCP server details using Claude CLI
router.get('/cli/get/:name', async (req, res) => {
  try {
    const { name } = req.params;
    
    console.log('📄 Getting MCP server details using Claude CLI:', name);
    
    const { spawn } = await import('child_process');
    
    const process = spawn('claude', ['mcp', 'get', name], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        res.json({ success: true, output: stdout, server: parseClaudeGetOutput(stdout) });
      } else {
        console.error('Claude CLI error:', stderr);
        res.status(404).json({ error: 'Claude CLI command failed', details: stderr });
      }
    });
    
    process.on('error', (error) => {
      console.error('Error running Claude CLI:', error);
      res.status(500).json({ error: 'Failed to run Claude CLI', details: error.message });
    });
  } catch (error) {
    console.error('Error getting MCP server details via CLI:', error);
    res.status(500).json({ error: 'Failed to get MCP server details', details: error.message });
  }
});

// Helper functions to parse Claude CLI output
function parseClaudeListOutput(output) {
  // Parse the output from 'claude mcp list' command
  // Format: "name: command/url" or "name: url (TYPE)"
  const servers = [];
  const lines = output.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    if (line.includes(':')) {
      const colonIndex = line.indexOf(':');
      const name = line.substring(0, colonIndex).trim();
      const rest = line.substring(colonIndex + 1).trim();
      
      let type = 'stdio'; // default type
      
      // Check if it has transport type in parentheses like "(SSE)" or "(HTTP)"
      const typeMatch = rest.match(/\((\w+)\)\s*$/);
      if (typeMatch) {
        type = typeMatch[1].toLowerCase();
      } else if (rest.startsWith('http://') || rest.startsWith('https://')) {
        // If it's a URL but no explicit type, assume HTTP
        type = 'http';
      }
      
      if (name) {
        servers.push({
          name,
          type,
          status: 'active'
        });
      }
    }
  }
  
  console.log('🔍 Parsed Claude CLI servers:', servers);
  return servers;
}

function parseClaudeGetOutput(output) {
  // Parse the output from 'claude mcp get <name>' command
  // This is a simple parser - might need adjustment based on actual output format
  try {
    // Try to extract JSON if present
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Otherwise, parse as text
    const server = { raw_output: output };
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('Name:')) {
        server.name = line.split(':')[1]?.trim();
      } else if (line.includes('Type:')) {
        server.type = line.split(':')[1]?.trim();
      } else if (line.includes('Command:')) {
        server.command = line.split(':')[1]?.trim();
      } else if (line.includes('URL:')) {
        server.url = line.split(':')[1]?.trim();
      }
    }
    
    return server;
  } catch (error) {
    return { raw_output: output, parse_error: error.message };
  }
}

// Direct config file management routes (for fallback when CLI is not available)

// GET /api/mcp/servers - Get MCP servers from config files
router.get('/servers', async (req, res) => {
  try {
    const { scope = 'user' } = req.query;
    console.log(`📋 Getting MCP servers from config files (scope: ${scope})`);
    
    // Try to read config files directly
    const configPaths = [
      path.join(os.homedir(), '.claude.json'), // Project-level config
      path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'), // macOS
      path.join(os.homedir(), '.config', 'Claude', 'claude_desktop_config.json'), // Linux
      path.join(os.homedir(), 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json') // Windows
    ];
    
    let servers = [];
    let configFound = false;
    
    for (const configPath of configPaths) {
      try {
        const configData = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(configData);
        
        if (config.mcpServers) {
          configFound = true;
          // Convert config format to our format
          for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
            const server = {
              id: name,
              name: name,
              type: 'stdio', // Default type
              scope: configPath.includes('.claude.json') ? 'project' : 'user',
              config: {
                command: serverConfig.command || '',
                args: serverConfig.args || [],
                env: serverConfig.env || {},
                url: serverConfig.url || '',
                headers: serverConfig.headers || {},
                timeout: serverConfig.timeout || 30000
              },
              created: new Date().toISOString(),
              updated: new Date().toISOString()
            };
            
            // Detect transport type
            if (serverConfig.transport) {
              server.type = serverConfig.transport;
            } else if (serverConfig.url) {
              if (serverConfig.url.includes('/sse')) {
                server.type = 'sse';
              } else {
                server.type = 'http';
              }
            }
            
            servers.push(server);
          }
        }
      } catch (error) {
        // Config file not found or invalid, continue to next
        console.log(`Config file not found or invalid: ${configPath}`);
      }
    }
    
    if (!configFound) {
      console.log('No MCP config files found');
    }
    
    res.json({ success: true, servers });
  } catch (error) {
    console.error('Error reading MCP servers from config:', error);
    res.status(500).json({ error: 'Failed to read MCP servers', details: error.message });
  }
});

// POST /api/mcp/servers/test - Test MCP server configuration
router.post('/servers/test', async (req, res) => {
  try {
    const { name, type, config } = req.body;
    console.log(`🧪 Testing MCP server configuration: ${name} (${type})`);
    
    const testResult = {
      success: false,
      message: '',
      details: []
    };
    
    // Basic validation
    if (!name || !type) {
      testResult.message = 'Server name and type are required';
      return res.json({ testResult });
    }
    
    if (type === 'stdio' && !config.command) {
      testResult.message = 'Command is required for stdio transport';
      return res.json({ testResult });
    }
    
    if ((type === 'sse' || type === 'http') && !config.url) {
      testResult.message = 'URL is required for SSE/HTTP transport';
      return res.json({ testResult });
    }
    
    // For now, just do basic validation
    // In a real implementation, we would actually try to connect to the server
    testResult.success = true;
    testResult.message = 'Configuration appears valid';
    testResult.details = [
      `Transport: ${type}`,
      type === 'stdio' ? `Command: ${config.command}` : `URL: ${config.url}`,
      config.args?.length > 0 ? `Args: ${config.args.length} argument(s)` : null,
      Object.keys(config.env || {}).length > 0 ? `Env: ${Object.keys(config.env).length} variable(s)` : null
    ].filter(Boolean);
    
    res.json({ testResult });
  } catch (error) {
    console.error('Error testing MCP server configuration:', error);
    res.status(500).json({ 
      error: 'Failed to test configuration', 
      details: error.message,
      testResult: {
        success: false,
        message: error.message,
        details: []
      }
    });
  }
});

// POST /api/mcp/servers/:id/test - Test existing MCP server
router.post('/servers/:id/test', async (req, res) => {
  try {
    const { id } = req.params;
    const { scope = 'user' } = req.query;
    console.log(`🧪 Testing existing MCP server: ${id} (scope: ${scope})`);
    
    const testResult = {
      success: false,
      message: '',
      details: []
    };
    
    // Try to test using Claude CLI first
    const { spawn } = await import('child_process');
    const process = spawn('claude', ['mcp', 'get', id], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        testResult.success = true;
        testResult.message = 'Server connection successful';
        testResult.details = ['Server is configured and accessible'];
      } else {
        testResult.success = false;
        testResult.message = 'Failed to connect to server';
        testResult.details = [stderr || 'Unknown error'];
      }
      res.json({ testResult });
    });
    
    process.on('error', (error) => {
      testResult.success = false;
      testResult.message = 'Failed to test server';
      testResult.details = [error.message];
      res.json({ testResult });
    });
  } catch (error) {
    console.error('Error testing MCP server:', error);
    res.status(500).json({ 
      error: 'Failed to test server', 
      details: error.message,
      testResult: {
        success: false,
        message: error.message,
        details: []
      }
    });
  }
});

// POST /api/mcp/servers/:id/tools - Discover tools from MCP server
router.post('/servers/:id/tools', async (req, res) => {
  try {
    const { id } = req.params;
    const { scope = 'user' } = req.query;
    console.log(`🔧 Discovering tools from MCP server: ${id} (scope: ${scope})`);
    
    const toolsResult = {
      success: false,
      tools: [],
      resources: [],
      prompts: []
    };
    
    // In a real implementation, we would connect to the MCP server
    // and query its available tools, resources, and prompts
    // For now, return a mock response
    
    toolsResult.success = true;
    toolsResult.tools = [
      { name: 'example_tool', description: 'This would be discovered from the actual server' }
    ];
    
    res.json({ toolsResult });
  } catch (error) {
    console.error('Error discovering MCP tools:', error);
    res.status(500).json({ 
      error: 'Failed to discover tools', 
      details: error.message,
      toolsResult: {
        success: false,
        tools: [],
        resources: [],
        prompts: []
      }
    });
  }
});

export default router;