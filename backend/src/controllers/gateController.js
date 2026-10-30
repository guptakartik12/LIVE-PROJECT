const Booking = require('../models/Booking');
const ParkingSession = require('../models/ParkingSession');
const Notification = require('../models/Notification');
const { emitGateEvent, emitSlotUpdate } = require('../services/socketService');

// @desc    Scan and verify QR code data
// @route   POST /api/gate/verify-qr
const verifyQR = async (req, res) => {
  try {
    const { qrData, bookingId } = req.body;

    let targetId = bookingId;
    if (!targetId && qrData) {
      try {
        const parsed = JSON.parse(qrData);
        targetId = parsed.bookingId;
      } catch (e) {
        targetId = qrData.trim();
      }
    }

    if (!targetId) {
      return res.status(400).json({ success: false, message: 'Invalid QR data or booking ID' });
    }

    const booking = await Booking.findOne({ bookingId: targetId });
    if (!booking) {
      return res.status(404).json({ success: false, message: `No booking found with ID: ${targetId}` });
    }

    return res.json({
      success: true,
      booking
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Process Entry Gate (Boom Barrier Simulation)
// @route   POST /api/gate/entry
const processEntry = async (req, res) => {
  try {
    const { bookingId, gateName = 'North Gate Barrier 01' } = req.body;

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({ success: false, message: 'This reservation has been cancelled. Entry denied.' });
    }

    if (booking.bookingStatus === 'completed') {
      return res.status(400).json({ success: false, message: 'This reservation has already been used and completed.' });
    }

    if (booking.bookingStatus === 'active') {
      return res.status(400).json({ success: false, message: 'Vehicle already entered. Session is currently active.' });
    }

    // Check validity window (allow entry up to 30 mins early or during booked window)
    const now = new Date();
    const earlyToleranceMs = 30 * 60 * 1000;
    if (now.getTime() < new Date(booking.startTime).getTime() - earlyToleranceMs) {
      return res.status(400).json({
        success: false,
        message: `Too early for entry. Your scheduled booking starts at ${new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
      });
    }

    // Authorize entry
    booking.bookingStatus = 'active';
    booking.entryGateTime = now;
    await booking.save();

    // Create session record
    const session = await ParkingSession.create({
      booking: booking._id,
      bookingId: booking.bookingId,
      user: booking.user,
      slotId: booking.slotId,
      floorKey: booking.floorKey,
      vehiclePlate: booking.vehiclePlate,
      entryTime: now,
      status: 'active',
      entryGate: gateName
    });

    await Notification.create({
      user: booking.user,
      title: 'Gate Pass Validated — Barrier Lifted',
      message: `Welcome to ParkEase! You have entered via ${gateName}. Proceed to Slot ${booking.slotId} (${booking.floorName}).`,
      type: 'gate',
      relatedId: booking.bookingId
    });

    // Real-time broadcast
    emitGateEvent({
      action: 'ENTRY_AUTHORIZED',
      bookingId: booking.bookingId,
      slotId: booking.slotId,
      plate: booking.vehiclePlate,
      gate: gateName,
      timestamp: now
    });

    emitSlotUpdate({
      slotId: booking.slotId,
      floorKey: booking.floorKey,
      location: booking.location,
      status: 'occupied',
      bookingId: booking.bookingId
    });

    return res.json({
      success: true,
      message: 'Access Authorized: Barrier Opening...',
      action: 'OPEN_BARRIER',
      booking,
      session
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Process Exit Gate (Boom Barrier Simulation & Checkout)
// @route   POST /api/gate/exit
const processExit = async (req, res) => {
  try {
    const { bookingId, gateName = 'South Exit Barrier 02' } = req.body;

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    if (booking.bookingStatus === 'completed') {
      return res.status(400).json({ success: false, message: 'Vehicle already exited this session.' });
    }

    const now = new Date();
    let overstayMinutes = 0;
    let extraCharges = 0;

    // Check if overstayed past scheduled end time + 15 mins grace period
    const scheduledEnd = new Date(booking.endTime);
    const gracePeriodMs = 15 * 60 * 1000;
    if (now.getTime() > scheduledEnd.getTime() + gracePeriodMs) {
      const overstayMs = now.getTime() - scheduledEnd.getTime();
      overstayMinutes = Math.floor(overstayMs / (1000 * 60));
      const overstayHours = Math.ceil(overstayMinutes / 60);
      extraCharges = overstayHours * booking.hourlyRate;
    }

    // Complete booking and release slot
    booking.bookingStatus = 'completed';
    booking.exitGateTime = now;
    if (extraCharges > 0) {
      booking.totalAmount += extraCharges;
      booking.notes = `${booking.notes || ''} [Overstay: ${overstayMinutes}m, Extra: ₹${extraCharges}]`;
    }
    await booking.save();

    // Close session
    await ParkingSession.findOneAndUpdate(
      { bookingId, status: 'active' },
      {
        status: 'completed',
        exitTime: now,
        exitGate: gateName,
        overstayMinutes,
        extraCharges
      }
    );

    await Notification.create({
      user: booking.user,
      title: 'Parking Completed — Have a Safe Drive!',
      message: `Vehicle ${booking.vehiclePlate} exited via ${gateName}. Slot ${booking.slotId} is released.${extraCharges > 0 ? ` Overstay fee: ₹${extraCharges}` : ''}`,
      type: 'gate',
      relatedId: booking.bookingId
    });

    // Real-time broadcast: Slot is now immediately FREE for others!
    emitGateEvent({
      action: 'EXIT_COMPLETED',
      bookingId: booking.bookingId,
      slotId: booking.slotId,
      plate: booking.vehiclePlate,
      gate: gateName,
      timestamp: now,
      extraCharges
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
      message: 'Exit Authorized: Barrier Opening... Slot Released.',
      action: 'OPEN_BARRIER',
      booking,
      overstayMinutes,
      extraCharges
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  verifyQR,
  processEntry,
  processExit
};
