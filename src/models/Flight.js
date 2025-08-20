class Flight {
  constructor(data) {
    this.id = data.id;
    this.airline = data.airline;
    this.departure = data.departure;
    this.arrival = data.arrival;
    this.duration = data.duration;
    this.price = data.price;
    this.availableSeats = data.availableSeats;
    this.aircraft = data.aircraft;
  }
}

module.exports = Flight;
