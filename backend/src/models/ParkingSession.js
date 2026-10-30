const mongoose = require('mongoose');

const parkingSessionSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
    },
    bookingId: {
      type: String,
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    slotId: {
      type: String,
      required: true
    },
    floorKey: {
      type: String,
      required: true
    },
    vehiclePlate: {
      type: String,
      required: true
    },
    entryTime: {
      type: Date,
      default: Date.now
    },
    exitTime: {
      type: Date
    },
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active'
    },
    entryGate: {
      type: String,
      default: 'North Gate Barrier 01'
    },
    exitGate: {
      type: String,
      default: 'South Exit Barrier 02'
    },
    overstayMinutes: {
      type: Number,
      default: 0
    },
    extraCharges: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ParkingSession', parkingSessionSchema);
