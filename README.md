# Helm AI Server

Simple REST API for flight booking system built with Node.js and Express.

## Project Structure

```
src/
├── app.js              # Main application file
├── config/
│   └── dynamodb.js     # DynamoDB configuration
├── controllers/        # Business logic
│   ├── bookingController.js
│   ├── flightController.js
│   ├── userController.js
│   └── voiceController.js
├── models/             # Data models
│   ├── Booking.js
│   ├── Flight.js
│   └── User.js
└── routes/             # API routes
    ├── bookings.js
    ├── flights.js
    ├── users.js
    └── voice.js
```

## Installation

```bash
npm install
```

## Running the Application

```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## API Endpoints

### 1. Get Flights
- **GET** `/api/flights`
- **Query Params**: `destination`, `departure`, `passengers`
- **Example**: `GET /api/flights?destination=LAX&departure=JFK&passengers=2`

### 2. Confirm Booking
- **POST** `/api/bookings/confirm`
- **Query Params**: `flightId`, `passengers`, `paymentInfo`
- **Example**: `POST /api/bookings/confirm?flightId=FL001&passengers=1`

### 3. Get User Profile
- **GET** `/api/users/profile`
- **Query Params**: `userId`
- **Example**: `GET /api/users/profile?userId=U001`

### 4. User Login
- **POST** `/api/users/login`
- **Query Params**: `email`, `password`
- **Example**: `POST /api/users/login?email=john@example.com&password=password123`

### 5. Voice Prompt
- **POST** `/api/voice/prompt`
- **Query Params**: `prompt`, `userId`
- **Example**: `POST /api/voice/prompt?prompt=Find flights to Miami&userId=U001`

## Environment Variables

```
PORT=3000
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

All APIs return dummy data for demonstration purposes.
