
# ChatRoom (Express + React + WebSockets + MongoDB)

This project is a simple real-time chatroom:
- Backend: Node.js + Express + `ws` WebSockets
- Frontend: React (Vite)
- Storage: MongoDB via Mongoose (falls back to in-memory store if `MONGODB_URI` is not set)

## Project layout
- `server/` - Express + WebSocket backend (also serves the React build in production)
- `client/` - React frontend

## Local setup
1. Install dependencies:
   - `cd server && npm install`
   - `cd client && npm install`
2. Build the React app:
   - `cd client && npm run build`
3. Start the backend:
   - set `NODE_ENV=production`
   - optionally set `MONGODB_URI`
   - `cd server && npm start`

The backend serves the React build and exposes:
- `GET /api/messages?limit=50`
- `GET /healthz`
- WebSocket endpoint: `ws://localhost:10000/ws`

## MongoDB
Set `MONGODB_URI` in your environment (Render dashboard Environment variables).

Example:
`mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/chatroom?retryWrites=true&w=majority`

## Deploying to Render
Render Web Service that runs the backend and builds the frontend:

### Build command
From repo root:
```bash
cd client && npm ci && npm run build && cd ../server && npm ci
```

### Start command
```bash
cd server && npm start
```

### Environment variables
- `NODE_ENV=production`
- `MONGODB_URI=...` (recommended)

Open the Render service URL; then open two tabs to verify real-time updates.


# ChatRoom (Express + React + WebSockets + MongoDB)

This project is a simple real-time chatroom:
- Backend: Node.js + Express + `ws` WebSockets
- Frontend: React (Vite)
- Storage: MongoDB via Mongoose (falls back to in-memory store if `MONGODB_URI` is not set)

## Project layout
- `server/` - Express + WebSocket backend (also serves the React build in production)
- `client/` - React frontend

## Local setup
1. Install dependencies:
   - `cd server && npm install`
   - `cd client && npm install`
2. Build the React app:
   - `cd client && npm run build`
3. Start the backend:
   - set `NODE_ENV=production`
   - optionally set `MONGODB_URI`
   - `cd server && npm start`

The backend serves the React build and exposes:
- `GET /api/messages?limit=50`
- `GET /healthz`
- WebSocket endpoint: `ws://localhost:10000/ws`

## MongoDB
Set `MONGODB_URI` in your environment (Render dashboard Environment variables).

Example:
`mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/chatroom?retryWrites=true&w=majority`

## Deploying to Render
Render Web Service that runs the backend and builds the frontend:

### Build command
From repo root:
```bash
cd client && npm ci && npm run build && cd ../server && npm ci
```

### Start command
```bash
cd server && npm start
```

### Environment variables
- `NODE_ENV=production`
- `MONGODB_URI=...` (recommended)

Open the Render service URL; then open two tabs to verify real-time updates.


