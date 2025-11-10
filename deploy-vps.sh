#!/bin/bash

# ====================================
# DEEDS - VPS Deployment Script
# ====================================
# Quick deployment script for VPS
# Usage: ./deploy-vps.sh

set -e

echo "🚀 DEEDS VPS Deployment Script"
echo "================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "📝 Please copy .env.example to .env and configure it:"
    echo "   cp .env.example .env"
    echo "   nano .env"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed!"
    echo "📥 Install Docker first:"
    echo "   curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "   sudo sh get-docker.sh"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null; then
    echo "❌ Error: Docker Compose is not installed!"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Ask for confirmation
read -p "🔄 This will rebuild and restart all containers. Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "📦 Pulling latest changes from git (if available)..."
if command -v git &> /dev/null && [ -d .git ]; then
    git pull || echo "⚠️  Git pull failed or no remote configured"
else
    echo "⏭️  Skipping git pull (not a git repository)"
fi

echo ""
echo "🛑 Stopping existing containers..."
docker compose down

echo ""
echo "🏗️  Building Docker images..."
docker compose build --no-cache

echo ""
echo "🚀 Starting containers..."
docker compose up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

echo ""
echo "📊 Container status:"
docker compose ps

echo ""
echo "📝 Recent logs:"
docker compose logs --tail=20

echo ""
echo "================================"
echo "✅ Deployment completed!"
echo "================================"
echo ""
echo "🌐 Access your application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:4000"
echo ""
echo "📊 Check logs:"
echo "   docker compose logs -f"
echo ""
echo "🔄 Restart services:"
echo "   docker compose restart"
echo ""
echo "🛑 Stop services:"
echo "   docker compose down"
echo ""
