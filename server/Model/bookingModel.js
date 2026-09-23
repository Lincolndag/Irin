const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A booking must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A booking must belong to a user'],
    },
    startDate: {
      type: Date,
      required: [true, 'A booking must have a start date'],
    },
    guests: {
      type: Number,
      required: [true, 'A booking must include the number of guests'],
      min: [1, 'A booking must have at least one guest'],
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'paystack'],
      required: [true, 'A booking must choose a payment method'],
    },
    provider: {
      type: String,
      enum: ['stripe', 'paystack'],
      required: [true, 'A booking must track its payment provider'],
    },
    providerSessionId: String,
    providerReference: String,
    paymentUrl: String,
    currency: {
      type: String,
      uppercase: true,
      default: 'USD',
    },
    amount: {
      type: Number,
      required: [true, 'A booking must have an amount'],
      min: [0, 'A booking amount must be positive'],
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'cancelled'],
      default: 'pending',
    },
    paidAt: Date,
    verifiedAt: Date,
    paymentPayload: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  },
);

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ tour: 1, createdAt: -1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
