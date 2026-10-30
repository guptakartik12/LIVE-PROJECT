const ParkingFloor = require('../models/ParkingFloor');
const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');
const Location = require('../models/Location');

// @desc    Get all parking floors with real-time availability counts
// @route   GET /api/parking/floors
const getFloors = async (req, res) => {
  try {
    const { location = 'City Center Mall', dateStr, startHour } = req.query;
    const floors = await ParkingFloor.find({ isActive: true }).sort({ levelIndex: 1 });

    const now = new Date();
    const queryDateStr = dateStr || now.toISOString().slice(0, 10);
    const queryHour = startHour !== undefined ? parseInt(startHour, 10) : now.getHours();

    const [y, m, d] = queryDateStr.split('-').map(Number);
    const windowStart = new Date(y, m - 1, d, queryHour, 0, 0, 0);
    const windowEnd = new Date(windowStart.getTime() + 3600000); // 1 hr window

    // Find conflicting bookings for this window
    const activeBookings = await Booking.find({
      location,
      bookingStatus: { $in: ['confirmed', 'active'] },
      startTime: { $lt: windowEnd },
      endTime: { $gt: windowStart }
    });

    const bookedSlotIds = new Set(activeBookings.map(b => b.slotId));

    const floorsWithCounts = await Promise.all(
      floors.map(async (floor) => {
        const totalSlots = await ParkingSlot.countDocuments({
          floorKey: floor.key,
          locationName: location
        });

        const maintenanceSlots = await ParkingSlot.countDocuments({
          floorKey: floor.key,
          locationName: location,
          isUnderMaintenance: true
        });

        // Filter booked slots on this floor
        const floorBookedCount = activeBookings.filter(b => b.floorKey === floor.key).length;
        const availableSlots = Math.max(0, totalSlots - floorBookedCount - maintenanceSlots);

        return {
          key: floor.key,
          name: floor.name,
          prefix: floor.prefix,
          vehicleType: floor.vehicleType,
          capacity: floor.capacity,
          hourlyRate: floor.hourlyRate,
          tagline: floor.tagline,
          totalSlots,
          availableSlots,
          occupiedSlots: floorBookedCount,
          maintenanceSlots
        };
      })
    );

    return res.json({ success: true, floors: floorsWithCounts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all parking facilities / locations
// @route   GET /api/parking/locations
const getLocations = async (req, res) => {
  try {
    const locations = await Location.find();
    return res.json({ success: true, locations });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get slots for a specific floor with real-time status calculation
// @route   GET /api/parking/floors/:floorKey/slots
const getFloorSlots = async (req, res) => {
  try {
    const { floorKey } = req.params;
    const { location = 'City Center Mall', dateStr, startHour, duration = 1 } = req.query;

    const floor = await ParkingFloor.findOne({ key: floorKey });
    if (!floor) {
      return res.status(404).json({ success: false, message: 'Parking floor not found' });
    }

    const slots = await ParkingSlot.find({
      floorKey,
      locationName: location
    }).sort({ slotNumber: 1 });

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

    // Query all bookings intersecting with this window
    const overlappingBookings = await Booking.find({
      floorKey,
      location,
      bookingStatus: { $in: ['confirmed', 'active'] },
      startTime: { $lt: windowEnd },
      endTime: { $gt: windowStart }
    });

    const bookingMap = new Map();
    overlappingBookings.forEach((b) => {
      bookingMap.set(b.slotId, b);
    });

    // Map each slot to real database state
    const processedSlots = slots.map((s) => {
      let status = 'available'; // green
      let activeBooking = null;

      if (s.isUnderMaintenance) {
        status = 'maintenance'; // grey
      } else if (bookingMap.has(s.slotId)) {
        const b = bookingMap.get(s.slotId);
        activeBooking = {
          bookingId: b.bookingId,
          userName: b.userName,
          vehiclePlate: b.vehiclePlate,
          startTime: b.startTime,
          endTime: b.endTime,
          bookingStatus: b.bookingStatus
        };

        if (b.bookingStatus === 'active') {
          status = 'occupied'; // red (car is physically parked)
        } else {
          status = 'reserved'; // yellow (advance booking window)
        }
      }

      return {
        _id: s._id,
        slotId: s.slotId,
        slotNumber: s.slotNumber,
        floorKey: s.floorKey,
        floorName: s.floorName,
        vehicleType: s.vehicleType,
        pricePerHour: s.pricePerHour,
        hasEVCharging: s.hasEVCharging,
        chargingPower: s.chargingPower,
        landmark: s.landmark,
        row: s.row,
        column: s.column,
        status, // 'available' | 'occupied' | 'reserved' | 'maintenance'
        isUnderMaintenance: s.isUnderMaintenance,
        maintenanceReason: s.maintenanceReason,
        activeBooking
      };
    });

    return res.json({
      success: true,
      floor,
      slots: processedSlots,
      window: {
        startTime: windowStart,
        endTime: windowEnd
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getFloors,
  getLocations,
  getFloorSlots
};
