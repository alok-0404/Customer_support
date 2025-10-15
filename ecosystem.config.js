module.exports = {
  apps: [{
    name: 'customer-support-api',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4000,
      MONGO_URI: 'mongodb+srv://techglobe0301:techglobe0301@cluster0.4k3mx4p.mongodb.net/customer_support?retryWrites=true&w=majority&appName=Cluster0',
      JWT_ACCESS_SECRET: 'your-super-secret-jwt-key-change-this-in-production-min-32-chars',
      JWT_ACCESS_EXPIRES_IN: '15m',
      CORS_WHITELIST: 'http://localhost:3001,http://localhost:3000,http://admin-customer-support-frontend-2025.s3-website-us-east-1.amazonaws.com,https://admin-customer-support-frontend-2025.s3-website-us-east-1.amazonaws.com,http://client-support01.s3-website-us-east-1.amazonaws.com,https://client-support01.s3-website-us-east-1.amazonaws.com,http://44.221.30.127,https://44.221.30.127',
      EMAIL_HOST: 'smtp.sendgrid.net',
      EMAIL_PORT: '587',
      EMAIL_SECURE: 'false',
      EMAIL_USER: 'apikey',
      EMAIL_PASSWORD: 'SG.your-sendgrid-api-key-here',
      EMAIL_FROM: 'your-verified-email@gmail.com',
      FRONTEND_URL: 'http://admin-customer-support-frontend-2025.s3-website-us-east-1.amazonaws.com'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
