const confirmBooking = (req, res) => {
  const { flightId, passengers, paymentInfo } = req.query;
  
  const dummyBookingConfirmation = {
    success: true,
    data: {
      bookingId: 'BK' + Date.now(),
      status: 'confirmed',
      flight: {
        id: flightId || 'FL001',
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
        }
      },
      passengers: [
        {
          id: 'P001',
          name: 'John Doe',
          seat: '12A',
          ticketNumber: 'TK' + Date.now()
        }
      ],
      totalAmount: 299,
      paymentStatus: 'completed',
      confirmationCode: 'CNF' + Date.now().toString().slice(-6),
      bookingDate: new Date().toISOString()
    },
    message: 'Booking confirmed successfully'
  };

  res.json(dummyBookingConfirmation);
};

module.exports = {
  confirmBooking
};
