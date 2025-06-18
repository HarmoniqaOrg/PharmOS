#!/bin/bash
# PharmOS Development Startup Script

echo "🚀 Starting PharmOS Development Environment"
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Function to start a service in background
start_service() {
    local name=$1
    local cmd=$2
    local log_file="logs/${name}.log"
    
    mkdir -p logs
    echo "Starting $name..."
    nohup $cmd > "$log_file" 2>&1 &
    echo $! > "logs/${name}.pid"
    echo "✓ $name started (PID: $!)"
}

# Kill any existing processes
echo "Cleaning up existing processes..."
if [ -d "logs" ]; then
    for pidfile in logs/*.pid; do
        if [ -f "$pidfile" ]; then
            pid=$(cat "$pidfile")
            if ps -p "$pid" > /dev/null 2>&1; then
                kill "$pid" 2>/dev/null || true
            fi
            rm "$pidfile"
        fi
    done
fi

# Start backend API server
start_service "backend-api" "npm run dev"
sleep 2

# Start Python ML service
start_service "ml-service" "python3 src/api/main.py"
sleep 2

# Start frontend dev server
cd frontend
start_service "frontend" "npm run dev"
cd ..

echo ""
echo "✅ All services started successfully!"
echo ""
echo "📍 Service URLs:"
echo "   - Frontend:    http://localhost:3001"
echo "   - Backend API: http://localhost:3000"
echo "   - ML Service:  http://localhost:8000"
echo "   - API Docs:    http://localhost:8000/docs"
echo ""
echo "📝 Demo Login:"
echo "   - Email: demo@pharmos.ai"
echo "   - Password: demo123"
echo ""
echo "📋 Logs are available in the 'logs' directory"
echo ""
echo "To stop all services, run: ./stop-dev.sh"