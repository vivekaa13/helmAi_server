const getUser = (req, res) => {
  const { userId } = req.query;
  
  const dummyUser = {
    success: true,
    data: {
      id: userId || 'U001',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1-555-0123',
      dateOfBirth: '1990-05-15',
      preferences: {
        seatType: 'aisle',
        mealPreference: 'vegetarian',
        notifications: true
      },
      membershipLevel: 'Gold',
      totalFlights: 24,
      milesAccumulated: 125000,
      registrationDate: '2020-03-12T10:30:00Z'
    }
  };

  res.json(dummyUser);
};

const login = (req, res) => {
  const { email, password } = req.query;
  
  const dummyLoginResponse = {
    success: true,
    data: {
      token: 'jwt_' + Date.now() + '_dummy_token',
      user: {
        id: 'U001',
        email: email || 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        membershipLevel: 'Gold'
      },
      expiresIn: '24h'
    },
    message: 'Login successful'
  };

  res.json(dummyLoginResponse);
};

module.exports = {
  getUser,
  login
};
