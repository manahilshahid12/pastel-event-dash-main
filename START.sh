#!/bin/bash

# Bloom Platform - Quick Start Script

echo "🌸 Starting Bloom Platform..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies (this may take a moment)..."
    npm install
    echo ""
fi

echo "🚀 Starting development server..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Bloom is starting up..."
echo ""
echo "📍 Open your browser and visit:"
echo ""
echo "   👉 http://localhost:8080/"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Tips:"
echo "   • Wait 10-15 seconds for the page to load"
echo "   • Keep this terminal window open while using the app"
echo "   • Press Ctrl+C to stop the server when done"
echo ""

npm run dev
