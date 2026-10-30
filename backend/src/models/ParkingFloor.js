const mongoose = require('mongoose');

const parkingFloorSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      enum: ['b', 'f', 's'] // b: Basement, f: First Floor, s: Second Floor
    },
    name: {
      type: String,
      required: true
    },
    prefix: {
      type: String,
      required: true
    },
    vehicleType: {
      type: String,
      required: true,
      enum: ['Car', 'Bike', 'EV']
    },
    capacity: {
      type: Number,
      required: true
    },
    hourlyRate: {
      type: Number,
      required: true
    },
    tagline: {
      type: String,
      default: ''
    },
    levelIndex: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ParkingFloor', parkingFloorSchema);
