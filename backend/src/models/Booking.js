const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    userEmail: {
      type: String,
      required: true
    },
    userPhone: {
      type: String,
      default: ''
    },
    vehiclePlate: {
      type: String,
      required: true,
      trim: true
    },
    vehicleType: {
      type: String,
      enum: ['Car', 'Bike', 'EV'],
      default: 'Car'
    },
    location: {
      type: String,
      required: true,
      default: 'City Center Mall'
    },
    floorKey: {
      type: String,
      required: true,
      enum: ['b', 'f', 's']
    },
    floorName: {
      type: String,
      default: 'Basement Level'
    },
    slotId: {
      type: String,
      required: true
    },
    dateStr: {
      type: String,
      required: true
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    durationHours: {
      type: Number,
      required: true,
      min: 1
    },
    hourlyRate: {
      type: Number,
      required: true
    },
    subtotal: {
      type: Number,
      required: true
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true
    },
    isMemberBooking: {
      type: Boolean,
      default: false
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'failed'],
      default: 'pending'
    },
    paymentDetails: {
      orderId: { type: String, default: '' },
      paymentId: { type: String, default: '' },
      signature: { type: String, default: '' },
      method: { type: String, default: 'Razorpay UPI' },
      paidAt: { type: Date }
    },
    bookingStatus: {
      type: String,
      enum: ['confirmed', 'active', 'completed', 'cancelled', 'expired'],
      default: 'confirmed'
    },
    entryGateTime: {
      type: Date
    },
    exitGateTime: {
      type: Date
    },
    qrCodeData: {
      type: String,
      default: ''
    },
    landmark: {
      type: String,
      default: 'Near Elevator'
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

bookingSchema.index({ slotId: 1, startTime: 1, endTime: 1, bookingStatus: 1 });
bookingSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
