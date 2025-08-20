class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.phone = data.phone;
    this.dateOfBirth = data.dateOfBirth;
    this.preferences = data.preferences;
    this.membershipLevel = data.membershipLevel;
    this.totalFlights = data.totalFlights;
    this.milesAccumulated = data.milesAccumulated;
    this.registrationDate = data.registrationDate;
  }
}

module.exports = User;
