const Booking = require('../models/Booking');
const ParkingSlot = require('../models/ParkingSlot');
const ParkingFloor = require('../models/ParkingFloor');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { generateQRCodeDataURL } = require('../utils/qrGenerator');
const { emitSlotUpdate, emitBookingUpdate } = require('../services/socketService');
const { sendBookingConfirmationEmail } = require('../services/emailService');

// @desc    Create a new parking reservation
// @route   POST /api/bookings
const createBooking = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const {
      slotId,
      floorKey,
      location = 'City Center Mall',
      vehiclePlate,
      vehicleType = 'Car',
      dateStr,
      startHour,
      durationHours = 1,
      paymentMethod = 'Razorpay UPI'
    } = req.body;

    if (!slotId || !floorKey || !dateStr || startHour === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required booking parameters' });
    }

    const duration = parseInt(durationHours, 10);
    const hour = parseInt(startHour, 10);

    // 1. Advance Booking Validation (Normal User: max 1-day, Premium Member: 7-day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [y, m, d] = dateStr.split('-').map(Number);
    const bookingDate = new Date(y, m - 1, d);
    bookingDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((bookingDate - today) / (1000 * 60 * 60 * 24));

    const isMember = user.membership && user.membership.type === 'PREMIUM';
    const maxAllowedDays = isMember ? 7 : 1;

    if (diffDays < 0) {
      return res.status(400).json({ success: false, message: 'Cannot book in the past' });
    }

    if (diffDays > maxAllowedDays) {
      return res.status(403).json({
        success: false,
        message: `Your membership tier allows up to ${maxAllowedDays}-day advance booking. Upgrade to Premium for 7-day advance booking.`
      });
    }

    // 2. Compute exact requested time range
    const startTime = new Date(y, m - 1, d, hour, 0, 0, 0);
    const endTime = new Date(startTime.getTime() + duration * 3600000);

    // 3. Verify Slot Exists & is not under maintenance
    const slot = await ParkingSlot.findOne({ slotId, floorKey, locationName: location });
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Parking slot not found' });
    }

    if (slot.isUnderMaintenance) {
      return res.status(400).json({
        success: false,
        message: `Slot ${slotId} is currently under maintenance: ${slot.maintenanceReason || 'Unavailable'}`
      });
    }

    // 4. Overlap & Double-Booking Prevention (Strict Concurrency Check)
    const conflictingBooking = await Booking.findOne({
      slotId,
      location,
      bookingStatus: { $in: ['confirmed', 'active'] },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime }
    });

    if (conflictingBooking) {
      return res.status(409).json({
        success: false,
        message: `Slot ${slotId} is already reserved between ${new Date(conflictingBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} and ${new Date(conflictingBooking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
      });
    }

    // 5. Price calculation & Membership Discount
    const floor = await ParkingFloor.findOne({ key: floorKey });
    const hourlyRate = floor ? floor.hourlyRate : slot.pricePerHour || 40;
    const subtotal = hourlyRate * duration;

    let discountAmount = 0;
    if (isMember) {
      discountAmount = Math.round(subtotal * 0.20); // 20% discount
    }
    const totalAmount = Math.max(0, subtotal - discountAmount);

    // 6. Generate Unique Booking ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingId = `PK-${randomSuffix}`;

    // 7. Generate Digital QR Code Data URL
    const qrPayload = {
      bookingId,
      slotId,
      plate: vehiclePlate || user.plate,
      userName: user.name,
      location,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    };
    const qrCodeData = await generateQRCodeDataURL(qrPayload);

    // 8. Create and persist booking
    const booking = await Booking.create({
      bookingId,
      user: user._id,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone,
      vehiclePlate: vehiclePlate ? vehiclePlate.toUpperCase() : user.plate,
      vehicleType: vehicleType || slot.vehicleType,
      location,
      floorKey,
      floorName: floor ? floor.name : 'Parking Floor',
      slotId,
      dateStr,
      startTime,
      endTime,
      durationHours: duration,
      hourlyRate,
      subtotal,
      discountAmount,
      totalAmount,
      isMemberBooking: isMember,
      paymentStatus: 'paid',
      paymentDetails: {
        orderId: `order_rzp_${Date.now()}`,
        paymentId: `pay_rzp_${Date.now()}`,
        method: paymentMethod,
        paidAt: new Date()
      },
      bookingStatus: 'confirmed',
      qrCodeData,
      landmark: slot.landmark || 'Near Elevator Lobby',
      notes: `Reserved via ParkEase Web App (${paymentMethod})`
    });

    // 9. Create in-app Notification
    await Notification.create({
      user: user._id,
      title: `Booking Confirmed: Spot ${slotId}`,
      message: `Your booking for Spot ${slotId} at ${location} is confirmed. Pass ID: ${bookingId}`,
      type: 'booking',
      relatedId: bookingId
    });

    // 10. Real-time updates via Socket.IO
    emitSlotUpdate({
      slotId,
      floorKey,
      location,
      status: 'reserved',
      bookingId
    });

    emitBookingUpdate({
      userId: user._id.toString(),
      bookingId,
      slotId,
      status: 'confirmed'
    });

    // 11. Send email confirmation in background
    sendBookingConfirmationEmail({
      to: user.email,
      userName: user.name,
      bookingId,
      slotId,
      floorName: floor ? floor.name : 'Basement',
      startTime,
      endTime,
      totalAmount
    }).catch(err => console.error('Email error:', err.message));

    return res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully',
      booking
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's personal booking history
// @route   GET /api/bookings/my
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id }).sort({ createdAt: -1 });

    const now = new Date();
    // Dynamically annotate session timings
    const annotated = bookings.map((b) => {
      const obj = b.toObject();
      obj.isUpcoming = now < b.startTime;
      obj.isActive = now >= b.startTime && now <= b.endTime && b.bookingStatus === 'active';
      obj.isExpired = now > b.endTime || b.bookingStatus === 'completed';
      return obj;
    });

    return res.json({ success: true, bookings: annotated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single booking by ID (Pass View)
// @route   GET /api/bookings/:id
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    let booking = await Booking.findOne({ bookingId: id });
    if (!booking) {
      booking = await Booking.findById(id).catch(() => null);
    }

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking pass not found' });
    }

    return res.json({ success: true, booking });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel a booking
// @route   PUT /api/bookings/:id/cancel
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findOne({ bookingId: id });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only booking owner or admin can cancel
    if (booking.user.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
    }

    if (booking.bookingStatus === 'completed' || booking.bookingStatus === 'cancelled') {
      return res.status(400).json({ success: false, message: `Booking is already ${booking.bookingStatus}` });
    }

    booking.bookingStatus = 'cancelled';
    booking.paymentStatus = 'refunded';
    booking.paymentDetails.refundId = `ref_${Date.now()}`;
    await booking.save();

    await Notification.create({
      user: booking.user,
      title: `Booking Cancelled (${booking.bookingId})`,
      message: `Your booking for Slot ${booking.slotId} was cancelled. Refund of ₹${booking.totalAmount} has been initiated.`,
      type: 'cancellation',
      relatedId: booking.bookingId
    });

    emitSlotUpdate({
      slotId: booking.slotId,
      floorKey: booking.floorKey,
      location: booking.location,
      status: 'available',
      bookingId: booking.bookingId
    });

    return res.json({
      success: true,
      message: 'Booking cancelled and refund processed',
      booking
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Extend a booking
// @route   PUT /api/bookings/:id/extend
const extendBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { extraHours = 1 } = req.body;

    const booking = await Booking.findOne({ bookingId: id });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const currentEnd = new Date(booking.endTime);
    const newEnd = new Date(currentEnd.getTime() + extraHours * 3600000);

    // Check if slot has conflicting booking during extension period
    const conflict = await Booking.findOne({
      _id: { $ne: booking._id },
      slotId: booking.slotId,
      location: booking.location,
      bookingStatus: { $in: ['confirmed', 'active'] },
      startTime: { $lt: newEnd },
      endTime: { $gt: currentEnd }
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: `Cannot extend: Another driver has reserved Slot ${booking.slotId} starting at ${new Date(conflict.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      });
    }

    const additionalCost = booking.hourlyRate * extraHours;
    const isMember = booking.isMemberBooking;
    const discount = isMember ? Math.round(additionalCost * 0.20) : 0;
    const netAdditional = additionalCost - discount;

    booking.endTime = newEnd;
    booking.durationHours += extraHours;
    booking.subtotal += additionalCost;
    booking.discountAmount += discount;
    booking.totalAmount += netAdditional;
    await booking.save();

    await Notification.create({
      user: booking.user,
      title: `Booking Extended (${booking.bookingId})`,
      message: `Your session at Slot ${booking.slotId} is extended by ${extraHours} hr until ${newEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      type: 'booking',
      relatedId: booking.bookingId
    });

    return res.json({
      success: true,
      message: `Booking successfully extended by ${extraHours} hour(s)`,
      booking
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  extendBooking
};
