const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');
const { getRecommendedSlots } = require('../services/recommendationEngine');

// @desc    Get smart recommended parking slots based on vehicle and preferences
// @route   GET /api/recommendations
const getRecommendations = async (req, res) => {
  try {
    const {
      location = 'City Center Mall',
      vehicleType = 'Car',
      dateStr,
      startHour,
      duration = 1,
      requiresEVCharging = false,
      preferNearElevator = true
    } = req.query;

    const now = new Date();
    let windowStart, windowEnd;

    if (dateStr && startHour !== undefined) {
      const [y, m, d] = dateStr.split('-').map(Number);
      windowStart = new Date(y, m - 1, d, parseInt(startHour, 10), 0, 0, 0);
      windowEnd = new Date(windowStart.getTime() + parseInt(duration, 10) * 3600000);
    } else {
      windowStart = now;
      windowEnd = new Date(now.getTime() + 3600000);
    }

    // Find all slots matching location and not in maintenance
    const allSlots = await ParkingSlot.find({
      locationName: location,
      isUnderMaintenance: false
    });

    // Find overlapping bookings
    const busyBookings = await Booking.find({
      location,
      bookingStatus: { $in: ['confirmed', 'active'] },
      startTime: { $lt: windowEnd },
      endTime: { $gt: windowStart }
    });

    const busySlotIds = new Set(busyBookings.map(b => b.slotId));
    const availableSlots = allSlots.filter(s => !busySlotIds.has(s.slotId));

    const recommendations = getRecommendedSlots(availableSlots, {
      vehicleType,
      requiresEVCharging: requiresEVCharging === 'true' || vehicleType === 'EV',
      preferNearElevator: preferNearElevator !== 'false'
    });

    return res.json({
      success: true,
      totalAvailable: availableSlots.length,
      recommendations: recommendations.slice(0, 5) // Top 5 recommended bays
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getRecommendations
};
