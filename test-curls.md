# Curl Commands to Test Voice Cancellation Flow

## Test the Complete Cancellation Workflow

### Step 1: User requests flight cancellation
```bash
curl -X POST http://127.0.0.1:3000/api/voice/process \
-H "Content-Type: application/json" \
-d '{
  "text": "I want to cancel my flight",
  "userId": "USER001"
}'
```

**Expected Response:** Intent should be `flight_cancellation` asking for confirmation number

### Step 2: User provides confirmation number (triggers Lambda call)
```bash
curl -X POST http://127.0.0.1:3000/api/voice/process \
-H "Content-Type: application/json" \
-d '{
  "text": "My confirmation number is ABC123",
  "userId": "USER001"
}'
```

**Expected Response:** Should call Lambda, get trip data, and return cancellation confirmation

---

## Alternative Test Scenarios

### Test with different confirmation number formats:

#### With "confirmation code" terminology:
```bash
curl -X POST http://127.0.0.1:3000/api/voice/process \
-H "Content-Type: application/json" \
-d '{
  "text": "My confirmation code is XYZ789",
  "userId": "USER001"
}'
```

#### With alphanumeric pattern (ABC123):
```bash
curl -X POST http://127.0.0.1:3000/api/voice/process \
-H "Content-Type: application/json" \
-d '{
  "text": "F8FSL2",
  "userId": "USER001"
}'
```

#### With 6-digit number:
```bash
curl -X POST http://127.0.0.1:3000/api/voice/process \
-H "Content-Type: application/json" \
-d '{
  "text": "123456",
  "userId": "USER001"
}'
```

---

## Test Other Intent Flows

### Flight Change with Confirmation Number:

#### Step 1: Request flight change
```bash
curl -X POST http://127.0.0.1:3000/api/voice/process \
-H "Content-Type: application/json" \
-d '{
  "text": "I need to change my flight",
  "userId": "USER002"
}'
```

#### Step 2: Provide confirmation number
```bash
curl -X POST http://127.0.0.1:3000/api/voice/process \
-H "Content-Type: application/json" \
-d '{
  "text": "My confirmation number is DEF456",
  "userId": "USER002"
}'
```

### Flight Check-in with Confirmation Number:

#### Step 1: Request check-in
```bash
curl -X POST http://127.0.0.1:3000/api/voice/process \
-H "Content-Type: application/json" \
-d '{
  "text": "I want to check in for my flight",
  "userId": "USER003"
}'
```

#### Step 2: Provide confirmation number
```bash
curl -X POST http://127.0.0.1:3000/api/voice/process \
-H "Content-Type: application/json" \
-d '{
  "text": "My booking reference is GHI789",
  "userId": "USER003"
}'
```

---

## Test Server Status

### Check if server is running:
```bash
curl http://127.0.0.1:3000/
```

### Test intent recognition without confirmation numbers:
```bash
curl -X POST http://127.0.0.1:3000/api/voice/process \
-H "Content-Type: application/json" \
-d '{
  "text": "I need help with my baggage",
  "userId": "USER004"
}'
```

---

## PowerShell Versions (for Windows)

If you're using PowerShell, use these commands:

### Step 1: Request cancellation
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:3000/api/voice/process" -Method POST -ContentType "application/json" -Body '{"text": "I want to cancel my flight", "userId": "USER001"}'
```

### Step 2: Provide confirmation number
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:3000/api/voice/process" -Method POST -ContentType "application/json" -Body '{"text": "My confirmation number is ABC123", "userId": "USER001"}'
```

---

## Expected Lambda Integration Behavior

1. **First Request**: Returns `flight_cancellation` intent
2. **Second Request**: 
   - Detects confirmation number pattern
   - Finds `flight_cancellation` in user's intent history
   - **Lambda 1**: Calls `https://hxbfsbcegpmohxsa2bkc6nisfy0lchoa.lambda-url.us-east-1.on.aws/?userId=USER001`
   - Processes upcoming trips data and gets earliest flight
   - Extracts `bookingId` from the selected trip
   - **Lambda 2**: Calls `https://wm6b7xql5roxzpkuo3seg4neje0ychje.lambda-url.us-east-1.on.aws/` with bookingId
   - Only on successful cancellation, returns personalized confirmation

## Debug Information

The server logs will show:
- `🔍 User USER001 provided confirmation number for cancellation`
- `📞 Calling Lambda API for user: USER001`
- `📊 Received X upcoming trips from Lambda`
- `📋 Found booking to cancel: [bookingId] - [confirmationNumber]`
- `🗑️ Calling cancellation Lambda for bookingId: [bookingId]`
- `✅ Cancellation Lambda response: [response data]`
- `🎉 Booking successfully cancelled: [confirmationNumber]`
- `✅ Booking cancelled successfully: [confirmationNumber] - [route]`
