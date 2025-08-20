const voicePrompt = (req, res) => {
  const { prompt, userId } = req.query;
  
  const dummyVoiceResponse = {
    success: true,
    data: [
      {
        id: 'FL001',
        airline: 'SkyWings',
        departure: {
          airport: 'JFK',
          city: 'New York',
          time: '08:30',
          date: '2025-08-25'
        },
        arrival: {
          airport: 'LAX',
          city: 'Los Angeles',
          time: '11:45',
          date: '2025-08-25'
        },
        duration: '5h 15m',
        price: 299,
        availableSeats: 45,
        aircraft: 'Boeing 737'
      },
      {
        id: 'FL003',
        airline: 'CloudAir',
        departure: {
          airport: 'JFK',
          city: 'New York',
          time: '16:45',
          date: '2025-08-25'
        },
        arrival: {
          airport: 'LAX',
          city: 'Los Angeles',
          time: '19:55',
          date: '2025-08-25'
        },
        duration: '5h 10m',
        price: 279,
        availableSeats: 67,
        aircraft: 'Boeing 787'
      }
    ],
    voiceProcessing: {
      originalPrompt: prompt || 'Find me flights to Los Angeles',
      processedIntent: 'flight_search',
      confidence: 0.95,
      parameters: {
        destination: 'Los Angeles',
        departure: 'New York',
        date: '2025-08-25'
      }
    },
    totalResults: 2,
    processingTime: '0.3s'
  };

  res.json(dummyVoiceResponse);
};

module.exports = {
  voicePrompt
};
