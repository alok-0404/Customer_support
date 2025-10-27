#!/bin/bash

# Setup API endpoint on same domain using nginx
# This adds /api route that proxies to backend

echo "🔧 Setting up API endpoint on main domain..."

# Check if already exists and backup
if [ -f /etc/nginx/sites-available/mydiamond99clientsupport.in ]; then
    echo "📋 Current nginx config found"
    
    # Create backup
    sudo cp /etc/nginx/sites-available/mydiamond99clientsupport.in /etc/nginx/sites-available/mydiamond99clientsupport.in.backup.$(date +%Y%m%d_%H%M%S)
    
    # Check if /api location already exists
    if grep -q "location /api" /etc/nginx/sites-available/mydiamond99clientsupport.in; then
        echo "✅ /api location already configured"
        sudo nginx -t && sudo systemctl reload nginx
        exit 0
    fi
    
    # Add /api location to existing config
    echo ""
    echo "📝 Adding /api location to existing nginx config..."
    echo ""
    echo "Manual steps:"
    echo "1. Open: sudo nano /etc/nginx/sites-available/mydiamond99clientsupport.in"
    echo "2. Add this inside server block (before 'location /'):"
    echo ""
    echo "    location /api {"
    echo "        proxy_pass http://localhost:4000;"
    echo "        proxy_http_version 1.1;"
    echo "        proxy_set_header Upgrade \$http_upgrade;"
    echo "        proxy_set_header Connection 'upgrade';"
    echo "        proxy_set_header Host \$host;"
    echo "        proxy_set_header X-Real-IP \$remote_addr;"
    echo "        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
    echo "        proxy_set_header X-Forwarded-Proto \$scheme;"
    echo "        proxy_cache_bypass \$http_upgrade;"
    echo "    }"
    echo ""
    echo "3. Save and reload: sudo nginx -t && sudo systemctl reload nginx"
    
else
    echo "⚠️  No existing nginx config found for mydiamond99clientsupport.in"
    echo ""
    echo "Create nginx config manually with:"
    echo ""
    echo "sudo nano /etc/nginx/sites-available/mydiamond99clientsupport.in"
fi

