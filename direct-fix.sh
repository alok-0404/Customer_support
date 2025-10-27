#!/bin/bash
# Final Fix for Nginx API Routing

echo "🔍 Finding problem..."

# Check what SSL configs exist
echo ""
echo "Current SSL configs:"
sudo grep -r "listen 443" /etc/nginx/sites-enabled/

echo ""
echo "Fixing..."

# Find the SSL config file
SSL_FILE=$(sudo grep -rl "ssl_certificate /etc/letsencrypt/live/mydiamond99clientsupport.in" /etc/nginx/sites-enabled/ | head -1)

if [ -z "$SSL_FILE" ]; then
    echo "❌ SSL config not found in sites-enabled"
    echo "Checking sites-available..."
    SSL_FILE=$(sudo grep -rl "ssl_certificate /etc/letsencrypt/live/mydiamond99clientsupport.in" /etc/nginx/sites-available/ | head -1)
fi

if [ ! -z "$SSL_FILE" ]; then
    echo "✅ Found SSL config at: $SSL_FILE"
    echo ""
    echo "Current config:"
    sudo cat "$SSL_FILE"
else
    echo "❌ No SSL config found"
    exit 1
fi

