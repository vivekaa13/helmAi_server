# Complete Two-Lambda Cancellation Flow - Curl Commands

## Main Test Sequence

### Step 1: Request Flight Cancellation
```bash
curl -X POST http://127.0.0.1:3000/api/voice/process \
-H "Content-Type: application/json" \
-d '{
  "text": "I want to cancel my flight",
  "userId": "USER001"
}'
```

**Expected Response:**
- Intent: `flight_cancellation`
- Asks for confirmation number

### Step 2: Provide Confirmation Number (Triggers Both Lambdas)
```bash
curl -X POST http://127.0.0.1:3000/api/voice/process \
-H "Content-Type: application/json" \
-d '{
  "text": "My confirmation number is ABC123",
  "userId": "USER001"
}'
```

**What Happens:**
1. 🔍 Detects confirmation number pattern
2. 📞 Calls Lambda 1: Get trips for USER001
3. 📋 Extracts bookingId from earliest trip
4. 🗑️ Calls Lambda 2: Cancel booking with bookingId
5. ✅ Returns success confirmation with flight details

---

## PowerShell Commands (Windows)

### Step 1: Request Cancellation
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:3000/api/voice/process" `
-Method POST `
-ContentType "application/json" `
-Body '{"text": "I want to cancel my flight", "userId": "USER001"}'
```

### Step 2: Provide Confirmation Number
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:3000/api/voice/process" `
-Method POST `
-ContentType "application/json" `
-Body '{"text": "My confirmation number is ABC123", "userId": "USER001"}'
```

---

## Alternative Test Scenarios

### Test Different Users
```bash
# User 002
curl -X POST http://127.0.0.1:3000/api/voice/process \
-H "Content-Type: application/json" \
-d '{"text": "I want to cancel my flight", "userId": "USER002"}'

curl -X POST http://127.0.0.1:3000/api/voice/process \
-H "Content-Type: application/json" \
-d '{"text": "My confirmation code is XYZ789", "userId": "USER002"}'
```

### Test Different Confirmation Number Formats
```bash
# Alphanumeric pattern
curl -X POST http://127.0.0.1:3000/api/voice/process \
-H "Content-Type: application/json" \
-d '{"text": "F8FSL2", "userId": "USER001"}'

# With "booking reference"
curl -X POST http://127.0.0.1:3000/api/voice/process \
-H "Content-Type: application/json" \
-d '{"text": "My booking reference is DEF456", "userId": "USER001"}'

# 6-digit number
curl -X POST http://127.0.0.1:3000/api/voice/process \
-H "Content-Type: application/json" \
-d '{"text": "123456", "userId": "USER001"}'
```

---

## Expected Response Structure

### Step 1 Response:
```json
{
  "success": true,
  "intent": "flight_cancellation",
  "userId": "USER001",
  "responseText": "I can help you cancel your flight. Please provide your confirmation number so I can locate your booking.",
  "screenAction": {
    "navigateTo": "TripsScreen",
    "showSection": "confirmation_input"
  },
  "data": {},
  "nextStep": {
    "expectedInput": "confirmation_number",
    "prompt": "Please say your confirmation number"
  }
}
```

### Step 2 Response (After Both Lambda Calls):
```json
{
  "success": true,
  "intent": "booking_cancellation_confirmed",
  "userId": "USER001",
  "responseText": "Your flight AA7891 from CDG → LGW scheduled for Sep 01, 2025 with confirmation number F8FSL2 has been successfully cancelled. A refund will be processed within 3-5 business days.",
  "screenAction": {
    "navigateTo": "TripsScreen",
    "showSection": "cancellation_confirmation"
  },
  "data": {
    "cancelledFlight": {
      "confirmationNumber": "F8FSL2",
      "route": "CDG → LGW",
      "date": "Sep 01, 2025",
      "flight": "AA7891",
      "totalAmount": 480,
      "refundAmount": 480,
      "refundTimeline": "3-5 business days"
    }
  },
  "nextStep": {
    "expectedInput": "cancellation_complete",
    "prompt": "Your booking has been cancelled. Is there anything else I can help you with?"
  }
}
```

---

## Debug & Server Status

### Check Server Status
```bash
curl http://127.0.0.1:3000/
```

### Test Without Cancellation Intent (Should Not Trigger Lambdas)
```bash
curl -X POST http://127.0.0.1:3000/api/voice/process \
-H "Content-Type: application/json" \
-d '{"text": "ABC123", "userId": "USER004"}'
```

---

## Lambda Flow Details

### Lambda 1 (Get Trips):
- **URL**: `https://hxbfsbcegpmohxsa2bkc6nisfy0lchoa.lambda-url.us-east-1.on.aws/?userId=USER001`
- **Method**: GET
- **Purpose**: Fetch user's upcoming trips

### Lambda 2 (Cancel Booking):
- **URL**: `https://wm6b7xql5roxzpkuo3seg4neje0ychje.lambda-url.us-east-1.on.aws/`
- **Method**: POST
- **Body**: `{"bookingId": "booking_1755854985068_h9zkbht"}`
- **Purpose**: Actually cancel the booking

---

## Server Logs to Watch For

When running the cancellation flow, watch the server terminal for:
```
🔍 User USER001 provided confirmation number for cancellation
📞 Calling Lambda API for user: USER001
📊 Received X upcoming trips from Lambda
📋 Found booking to cancel: booking_1755854985068_h9zkbht - F8FSL2
🗑️ Calling cancellation Lambda for bookingId: booking_1755854985068_h9zkbht
✅ Cancellation Lambda response: [response data]
🎉 Booking successfully cancelled: F8FSL2
✅ Booking cancelled successfully: F8FSL2 - CDG → LGW
```

---

## One-Line Test Commands

```bash
# Complete flow in sequence
curl -X POST http://127.0.0.1:3000/api/voice/process -H "Content-Type: application/json" -d '{"text": "I want to cancel my flight", "userId": "USER001"}' && echo -e "\n---\n" && curl -X POST http://127.0.0.1:3000/api/voice/process -H "Content-Type: application/json" -d '{"text": "My confirmation number is ABC123", "userId": "USER001"}'
```
