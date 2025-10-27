#!/bin/bash
# Fix nginx /api/ location matching

sudo sed -i 's|location /api/ {|location /api|' /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
curl https://mydiamond99clientsupport.in/api/health

