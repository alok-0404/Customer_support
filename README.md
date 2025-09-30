# Customer Support API (Slimmed)

## Setup

1. Copy `.env` from below and fill values
2. `npm install`
3. `npm run dev` or `npm start`

## .env example

```
PORT=4000
MONGO_URI=mongodb+srv://username:password@cluster/dbname?retryWrites=true&w=majority
JWT_SECRET=change_this_secret
CORS_WHITELIST=http://localhost:3000,https://yourapp.com
```

## Endpoints
- GET `/health`
- GET `/search?userId=AB123`
- GET `/branches?page=1&limit=10`
- GET `/users?page=1&limit=10`
