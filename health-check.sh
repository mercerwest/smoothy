#!/bin/bash

# SMOOTHY Health Check Script
# This script checks if all services are running correctly

echo "🔍 Checking SMOOTHY deployment health..."

# Check if Docker containers are running
echo "📦 Checking Docker containers..."
if docker-compose ps | grep -q "Up"; then
    echo "✅ Docker containers are running"
else
    echo "❌ Docker containers are not running"
    exit 1
fi

# Check server health
echo "🔧 Checking server health..."
if curl -f http://localhost:4000/ > /dev/null 2>&1; then
    echo "✅ Server is responding"
else
    echo "❌ Server is not responding"
    exit 1
fi

# Check frontend
echo "🌐 Checking frontend..."
if curl -f http://localhost/ > /dev/null 2>&1; then
    echo "✅ Frontend is responding"
else
    echo "❌ Frontend is not responding"
    exit 1
fi

# Check disk space
echo "💾 Checking disk space..."
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 90 ]; then
    echo "✅ Disk space is adequate ($DISK_USAGE% used)"
else
    echo "⚠️  Disk space is low ($DISK_USAGE% used)"
fi

# Check memory usage
echo "🧠 Checking memory usage..."
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
if [ "$MEMORY_USAGE" -lt 90 ]; then
    echo "✅ Memory usage is normal ($MEMORY_USAGE% used)"
else
    echo "⚠️  Memory usage is high ($MEMORY_USAGE% used)"
fi

echo ""
echo "🎉 SMOOTHY is healthy and ready to use!"
echo "🌐 Frontend: http://localhost"
echo "🔧 Backend: http://localhost:4000" 