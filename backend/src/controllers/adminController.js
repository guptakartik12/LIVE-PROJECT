const ParkingSlot = require('../models/ParkingSlot');
const ParkingFloor = require('../models/ParkingFloor');
const Booking = require('../models/Booking');
const User = require('../models/User');
const ParkingSession = require('../models/ParkingSession');
const { emitSlotUpdate } = require('../services/socketService');

// @desc    Get complete real-time dashboard analytics & stats
// @route   GET /api/admin/stats
const getAdminStats = async (req, res) => {
  try {
    const totalCapacity = await ParkingSlot.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const activeSessions = await ParkingSession.countDocuments({ status: 'active' });

    // Revenue calculation (paid bookings)
    const revenueAgg = await Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

    // Maintenance slots
    const maintenanceSlots = await ParkingSlot.countDocuments({ isUnderMaintenance: true });

    // Current occupancy right now
    const now = new Date();
    const activeAndReservedBookings = await Booking.find({
      bookingStatus: { $in: ['confirmed', 'active'] },
      startTime: { $lte: now },
      endTime: { $gte: now }
    });

    const occupiedCount = activeAndReservedBookings.filter(b => b.bookingStatus === 'active').length;
    const reservedCount = activeAndReservedBookings.filter(b => b.bookingStatus === 'confirmed').length;
    const occupiedOrReservedTotal = occupiedCount + reservedCount;
    const availableSlots = Math.max(0, totalCapacity - occupiedOrReservedTotal - maintenanceSlots);

    const occupancyRate = totalCapacity > 0 ? Math.round(((occupiedOrReservedTotal) / totalCapacity) * 100) : 0;

    // Membership stats
    const premiumMembers = await User.countDocuments({ 'membership.type': 'PREMIUM' });
    const normalUsers = await User.countDocuments({ 'membership.type': 'NORMAL' });

    // Recent transactions
    const recentTransactions = await Booking.find({ paymentStatus: 'paid' })
      .sort({ createdAt: -1 })
      .limit(6)
      .select('bookingId userName vehiclePlate slotId totalAmount paymentDetails createdAt');

    return res.json({
      success: true,
      stats: {
        totalCapacity,
        availableSlots,
        occupiedSlots: occupiedCount,
        reservedSlots: reservedCount,
        maintenanceSlots,
        occupancyPercentage: occupancyRate,
        totalBookings,
        totalUsers,
        totalRevenue,
        activeParkingSessions: activeSessions,
        membership: {
          premium: premiumMembers,
          normal: normalUsers
        },
        recentTransactions
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get chart analytics for Admin Dashboard
// @route   GET /api/admin/charts
const getAdminCharts = async (req, res) => {
  try {
    // 1. Vehicle category breakdown
    const vehicleDistribution = await Booking.aggregate([
      { $group: { _id: '$vehicleType', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } }
    ]);

    // 2. Floor Occupancy Breakdown
    const floors = await ParkingFloor.find();
    const floorBreakdown = await Promise.all(
      floors.map(async (f) => {
        const total = await ParkingSlot.countDocuments({ floorKey: f.key });
        const occupied = await Booking.countDocuments({
          floorKey: f.key,
          bookingStatus: { $in: ['confirmed', 'active'] }
        });
        return {
          floorKey: f.key,
          floorName: f.name,
          total,
          occupied,
          rate: f.hourlyRate
        };
      })
    );

    // 3. Weekly Bookings Aggregation (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyBookings = await Booking.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          bookings: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 4. Monthly Revenue Aggregation (last 6 months)
    const monthlyRevenue = await Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: { $dateToString: { format: '%b %Y', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 }
        }
      },
      { $limit: 6 }
    ]);

    return res.json({
      success: true,
      charts: {
        vehicleDistribution,
        floorBreakdown,
        weeklyBookings,
        monthlyRevenue
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle slot maintenance status
// @route   PUT /api/admin/slots/:id/maintenance
const toggleSlotMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const { isUnderMaintenance, maintenanceReason } = req.body;

    const slot = await ParkingSlot.findById(id);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    slot.isUnderMaintenance = isUnderMaintenance !== undefined ? isUnderMaintenance : !slot.isUnderMaintenance;
    if (maintenanceReason !== undefined) {
      slot.maintenanceReason = maintenanceReason;
    }
    await slot.save();

    emitSlotUpdate({
      slotId: slot.slotId,
      floorKey: slot.floorKey,
      location: slot.locationName,
      status: slot.isUnderMaintenance ? 'maintenance' : 'available'
    });

    return res.json({
      success: true,
      message: `Slot ${slot.slotId} maintenance status updated`,
      slot
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update floor hourly pricing
// @route   PUT /api/admin/floors/:key/price
const updateFloorPrice = async (req, res) => {
  try {
    const { key } = req.params;
    const { hourlyRate } = req.body;

    if (!hourlyRate || hourlyRate <= 0) {
      return res.status(400).json({ success: false, message: 'Valid hourly rate required' });
    }

    const floor = await ParkingFloor.findOneAndUpdate({ key }, { hourlyRate }, { new: true });
    if (!floor) {
      return res.status(404).json({ success: false, message: 'Floor not found' });
    }

    // Update slots on this floor too
    await ParkingSlot.updateMany({ floorKey: key }, { pricePerHour: hourlyRate });

    return res.json({
      success: true,
      message: `Floor ${floor.name} hourly rate updated to ₹${hourlyRate}/hr`,
      floor
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all bookings for admin management
// @route   GET /api/admin/bookings
const getAllBookings = async (req, res) => {
  try {
    const { status, floorKey, search } = req.query;
    const query = {};

    if (status) query.bookingStatus = status;
    if (floorKey) query.floorKey = floorKey;
    if (search) {
      query.$or = [
        { bookingId: { $regex: search, $options: 'i' } },
        { vehiclePlate: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { slotId: { $regex: search, $options: 'i' } }
      ];
    }

    const bookings = await Booking.find(query).sort({ createdAt: -1 });
    return res.json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users for admin management
// @route   GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.json({ success: true, count: users.length, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset all database data back to fresh factory state
// @route   POST /api/admin/reset-data
const resetAllData = async (req, res) => {
  try {
    const seedInitialData = require('../utils/seedData');
    await seedInitialData(true);
    return res.json({
      success: true,
      message: 'All database records successfully reset to initial factory state!'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAdminStats,
  getAdminCharts,
  toggleSlotMaintenance,
  updateFloorPrice,
  getAllBookings,
  getAllUsers,
  resetAllData
};
