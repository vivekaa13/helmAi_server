# Helm AI Server - Bedrock Agent Integration

A Node.js API server that provides persistent connection to AWS Bedrock Agents for conversational AI.

## Features

- 🤖 **Persistent Bedrock Agent Connection** - Maintains connection to avoid re-linking
- 💬 **Session Management** - Keeps conversation context alive
- 🔄 **Auto Session Cleanup** - Removes inactive sessions automatically
- 📊 **Status Monitoring** - Track active sessions and service health
- 🚀 **RESTful API** - Clean HTTP endpoints for integration

## Setup

### 1. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here

# Bedrock Agent Configuration  
BEDROCK_AGENT_ID=your_agent_id_here
BEDROCK_AGENT_ALIAS_ID=TSTALIASID

# Server Configuration
PORT=3000
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Server

```bash
npm start
```

## API Endpoints

### 🗣️ Send Prompt to Bedrock Agent
```http
POST /api/voice/prompt
Content-Type: application/json

{
  "prompt": "Hello, how can you help me today?",
  "userId": "user123" (optional)
}
```

### 📊 Get Session Information
```http
GET /api/voice/session/:userId
```

### 🔚 End Session
```http
DELETE /api/voice/session/:userId
```

### ⚡ Service Status
```http
GET /api/voice/status
```

## Session Management

- **Persistent Sessions**: Each user gets a persistent session that maintains conversation context
- **Auto Cleanup**: Sessions inactive for 30+ minutes are automatically removed
- **Session Tracking**: Monitor active sessions and message counts
- **Graceful Handling**: Failed requests don't break the session

## AWS Bedrock Setup

1. **Create Bedrock Agent**: Set up your agent in AWS Console
2. **Get Agent ID**: Copy your agent ID and alias ID
3. **IAM Permissions**: Ensure your AWS credentials have `bedrock:InvokeAgent` permission
4. **Configure Environment**: Add your credentials to `.env`

## Response Format

```json
{
  "success": true,
  "response": "Agent response text...",
  "sessionId": "session-1234567890-abc123",
  "messageCount": 5,
  "userId": "user123",
  "timestamp": "2025-08-22T10:30:00.000Z"
}
```

## Development

```bash
# Development with auto-reload
npm run dev

# Start production server
npm start
```

## Architecture

```
├── src/
│   ├── app.js                 # Main server setup
│   ├── controllers/
│   │   └── voiceController.js # API endpoint handlers
│   ├── routes/
│   │   └── voice.js          # Route definitions
│   └── services/
│       └── bedrockService.js  # Bedrock integration service
└── .env                       # Environment configuration
```

The `BedrockService` singleton maintains:
- Single AWS client instance
- User session mappings
- Conversation continuity
- Automatic cleanup processes
