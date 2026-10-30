const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema(
  {
    slotId: {
      type: String,
      required: true,
      trim: true
    },
    floorKey: {
      type: String,
      required: true,
      enum: ['b', 'f', 's']
    },
    floorName: {
      type: String,
      default: ''
    },
    locationName: {
      type: String,
      default: 'City Center Mall'
    },
    vehicleType: {
      type: String,
      required: true,
      enum: ['Car', 'Bike', 'EV']
    },
    slotNumber: {
      type: Number,
      required: true
    },
    pricePerHour: {
      type: Number,
      required: true
    },
    hasEVCharging: {
      type: Boolean,
      default: false
    },
    chargingPower: {
      type: String,
      default: '22 kW AC Fast'
    },
    isUnderMaintenance: {
      type: Boolean,
      default: false
    },
    maintenanceReason: {
      type: String,
      default: ''
    },
    landmark: {
      type: String,
      default: 'Near Elevator'
    },
    distanceScore: {
      type: Number,
      default: 1 // 1 closest to elevator/exit, 5 further
    },
    row: {
      type: Number,
      default: 1
    },
    column: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true
  }
);

parkingSlotSchema.index({ locationName: 1, floorKey: 1, slotId: 1 }, { unique: true });

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);
