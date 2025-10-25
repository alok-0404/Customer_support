#!/bin/bash

# Copy setup-ssl.sh to EC2

KEY_FILE="customer-support-backend.pem"
EC2_IP="44.221.30.127"
EC2_USER="ec2-user"

echo "📋 Copying setup-ssl.sh to EC2..."
scp -i "$KEY_FILE" setup-ssl.sh $EC2_USER@$EC2_IP:~/

echo "✅ Done! Now SSH into EC2:"
echo "ssh -i $KEY_FILE $EC2_USER@$EC2_IP"
