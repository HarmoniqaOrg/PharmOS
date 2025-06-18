#!/bin/bash
# PharmOS Development Stop Script

echo "🛑 Stopping PharmOS Development Environment"
echo "=========================================="

# Function to stop a service
stop_service() {
    local name=$1
    local pidfile="logs/${name}.pid"
    
    if [ -f "$pidfile" ]; then
        pid=$(cat "$pidfile")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo "Stopping $name (PID: $pid)..."
            kill "$pid" 2>/dev/null || true
            sleep 1
            
            # Force kill if still running
            if ps -p "$pid" > /dev/null 2>&1; then
                kill -9 "$pid" 2>/dev/null || true
            fi
            
            echo "✓ $name stopped"
        else
            echo "⚠️  $name was not running"
        fi
        rm "$pidfile"
    else
        echo "⚠️  No PID file found for $name"
    fi
}

# Stop all services
stop_service "frontend"
stop_service "ml-service"
stop_service "backend-api"

# Kill any remaining node or python processes on our ports
echo ""
echo "Checking for processes on ports..."
for port in 3000 3001 8000; do
    pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo "Killing process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null || true
    fi
done

echo ""
echo "✅ All services stopped"