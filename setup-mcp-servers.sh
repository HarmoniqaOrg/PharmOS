#!/bin/bash
# MCP Server Setup Script for PharmOS

set -e

echo "🔧 Setting up MCP Servers for PharmOS"
echo "===================================="

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please run setup-dev-environment.sh first."
    exit 1
fi

# Install MCP server packages
echo "Installing MCP server packages..."
npm install --save-dev \
    @modelcontextprotocol/server-postgres \
    @modelcontextprotocol/server-filesystem \
    @modelcontextprotocol/server-github \
    @modelcontextprotocol/server-web \
    @modelcontextprotocol/sdk

# Create MCP server wrapper scripts
mkdir -p scripts/mcp

# PostgreSQL MCP Server
cat > scripts/mcp/postgres-server.js <<'EOF'
#!/usr/bin/env node
const { createServer } = require('@modelcontextprotocol/server-postgres');

const server = createServer({
  connectionString: process.env.POSTGRES_CONNECTION_STRING || 
    'postgresql://pharmos_user:pharmos_pass@localhost:5432/pharmos_db'
});

server.start();
console.log('PostgreSQL MCP Server started');
EOF

# Filesystem MCP Server
cat > scripts/mcp/filesystem-server.js <<'EOF'
#!/usr/bin/env node
const { createServer } = require('@modelcontextprotocol/server-filesystem');

const server = createServer({
  rootPath: process.env.ROOT_PATH || process.cwd()
});

server.start();
console.log('Filesystem MCP Server started');
EOF

# Make scripts executable
chmod +x scripts/mcp/*.js

# Create systemd service files (for production)
cat > pharmos-mcp-postgres.service <<EOF
[Unit]
Description=PharmOS MCP PostgreSQL Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PWD
ExecStart=/usr/bin/node scripts/mcp/postgres-server.js
Restart=on-failure
Environment="NODE_ENV=production"
Environment="POSTGRES_CONNECTION_STRING=postgresql://pharmos_user:pharmos_pass@localhost:5432/pharmos_db"

[Install]
WantedBy=multi-user.target
EOF

# Create MCP client configuration
cat > config/mcp/client-config.js <<'EOF'
const { Client } = require('@modelcontextprotocol/sdk');

class MCPClient {
  constructor() {
    this.clients = {};
  }

  async connectPostgres(connectionString) {
    const client = new Client({
      name: 'postgres',
      version: '1.0.0'
    });
    
    await client.connect({
      connectionString: connectionString || process.env.POSTGRES_CONNECTION_STRING
    });
    
    this.clients.postgres = client;
    return client;
  }

  async connectFilesystem(rootPath) {
    const client = new Client({
      name: 'filesystem',
      version: '1.0.0'
    });
    
    await client.connect({
      rootPath: rootPath || process.cwd()
    });
    
    this.clients.filesystem = client;
    return client;
  }

  getClient(name) {
    return this.clients[name];
  }
}

module.exports = MCPClient;
EOF

echo "✅ MCP Servers setup completed!"
echo ""
echo "To start MCP servers manually:"
echo "  node scripts/mcp/postgres-server.js"
echo "  node scripts/mcp/filesystem-server.js"
echo ""
echo "For production deployment, copy the .service files to /etc/systemd/system/"