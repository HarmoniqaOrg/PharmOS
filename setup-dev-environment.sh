#!/bin/bash
# PharmOS Development Environment Setup Script

set -e

echo "🚀 PharmOS Development Environment Setup"
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check if running in WSL
if grep -qi microsoft /proc/version; then
    print_status "Detected WSL environment"
fi

# Update package list
echo "Updating package list..."
sudo apt-get update -qq

# Install Python pip if not present
if ! command -v pip3 &> /dev/null; then
    echo "Installing Python pip..."
    sudo apt-get install -y python3-pip python3-venv
    print_status "Python pip installed"
else
    print_status "Python pip already installed"
fi

# Install additional development tools
echo "Installing development tools..."
sudo apt-get install -y build-essential curl wget jq

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_status "Docker Compose installed"
else
    print_status "Docker Compose already installed"
fi

# Install PostgreSQL client tools
echo "Installing PostgreSQL client tools..."
sudo apt-get install -y postgresql-client

# Install Redis tools
echo "Installing Redis tools..."
sudo apt-get install -y redis-tools

# Create Python virtual environment
echo "Setting up Python virtual environment..."
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip setuptools wheel

print_status "Development environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Activate Python virtual environment: source venv/bin/activate"
echo "2. Run ./setup-pharmos.sh to initialize the PharmOS platform"