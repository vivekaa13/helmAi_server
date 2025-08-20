class Booking {
  constructor(data) {
    this.bookingId = data.bookingId;
    this.status = data.status;
    this.flight = data.flight;
    this.passengers = data.passengers;
    this.totalAmount = data.totalAmount;
    this.paymentStatus = data.paymentStatus;
    this.confirmationCode = data.confirmationCode;
    this.bookingDate = data.bookingDate;
  }
}

module.exports = Booking;
