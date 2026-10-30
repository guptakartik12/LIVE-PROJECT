const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
    address: {
      type: String,
      default: ''
    },
    distance: {
      type: String,
      default: '0.5 km'
    },
    info: {
      type: String,
      default: 'Covered · CCTV · EV Charging'
    },
    lat: {
      type: Number,
      required: true,
      default: 28.6139
    },
    lng: {
      type: Number,
      required: true,
      default: 77.2090
    },
    totalBays: {
      type: Number,
      default: 84
    },
    operatingHours: {
      type: String,
      default: '24/7 Mon-Sun'
    },
    amenities: [
      {
        type: String
      }
    ],
    contactPhone: {
      type: String,
      default: '+91 11 2345 6789'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Location', locationSchema);
