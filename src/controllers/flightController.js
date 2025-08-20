const getFlights = (req, res) => {
  const { destination, departure, passengers } = req.query;
  
  const dummyFlights = {
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
        id: 'FL002',
        airline: 'AeroFast',
        departure: {
          airport: 'JFK',
          city: 'New York',
          time: '14:20',
          date: '2025-08-25'
        },
        arrival: {
          airport: 'LAX',
          city: 'Los Angeles',
          time: '17:30',
          date: '2025-08-25'
        },
        duration: '5h 10m',
        price: 349,
        availableSeats: 23,
        aircraft: 'Airbus A320'
      }
    ],
    searchParams: {
      destination: destination || 'LAX',
      departure: departure || 'JFK',
      passengers: passengers || '1'
    },
    totalResults: 2
  };

  res.json(dummyFlights);
};

module.exports = {
  getFlights
};
