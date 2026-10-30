const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ParkingFloor = require('../models/ParkingFloor');
const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');
const Location = require('../models/Location');
const Notification = require('../models/Notification');
const { generateQRCodeDataURL } = require('./qrGenerator');

const seedInitialData = async (forceReset = false) => {
  try {
    if (!forceReset) {
      const userCount = await User.countDocuments();
      if (userCount > 0) {
        console.log('Database already initialized, checking if floors and slots need sync...');
        const slotCount = await ParkingSlot.countDocuments();
        if (slotCount >= 84) {
          return;
        }
      }
    }

    console.log('--- Initializing ParkEase Database Seed Data ---');

    // 1. Locations
    await Location.deleteMany({});
    const locations = await Location.insertMany([
      {
        name: 'City Center Mall',
        address: 'Sector 18, Central City Boulevard',
        distance: '0.4 km',
        info: 'Covered · CCTV · EV Charging',
        lat: 28.6139,
        lng: 77.2090,
        totalBays: 84,
        amenities: ['CCTV 24x7', 'EV Fast Charging', 'Car Wash', 'Disabled Friendly', 'Elevator Lobby']
      },
      {
        name: 'Central Metro Station',
        address: 'Platform 4 Concourse Plaza',
        distance: '1.2 km',
        info: 'Direct Concourse Link · 24/7',
        lat: 28.6289,
        lng: 77.2065,
        totalBays: 84,
        amenities: ['Direct Concourse Link', 'Smart Boom Barrier', 'Bike Shelters']
      },
      {
        name: 'Airport Express Hub',
        address: 'Terminal 3 Access Road',
        distance: '4.8 km',
        info: 'Long-term · Valet Available',
        lat: 28.5562,
        lng: 77.1000,
        totalBays: 84,
        amenities: ['Valet Service', 'Overnight Security', 'Shuttle Bus', 'Fast EV Bays']
      },
      {
        name: 'Riverside Financial Plaza',
        address: 'Tower B Financial District',
        distance: '2.1 km',
        info: 'Corporate · Security Monitored',
        lat: 28.6328,
        lng: 77.2195,
        totalBays: 84,
        amenities: ['Corporate Access', 'ANPR Cameras', 'Reserved Executive Slots']
      }
    ]);
    console.log('Locations seeded: 4');

    // 2. Users
    await User.deleteMany({});
    const passwordHashAdmin = await bcrypt.hash('admin123', 10);
    const passwordHashMember = await bcrypt.hash('member123', 10);
    const passwordHashUser = await bcrypt.hash('user123', 10);

    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    const adminUser = await User.create({
      name: 'ParkEase Administrator',
      email: 'admin@parkease.com',
      password: passwordHashAdmin,
      phone: '9800000000',
      plate: 'DL 00 AD 0001',
      role: 'ADMIN',
      membership: {
        type: 'PREMIUM',
        expiresAt: oneYearLater,
        joinedAt: new Date(),
        advanceDays: 7,
        discountPercent: 20
      },
      vehicles: [
        { plate: 'DL 00 AD 0001', type: 'Car', model: 'Skoda Octavia', isPrimary: true }
      ]
    });

    const premiumMember = await User.create({
      name: 'User 3 (Member)',
      email: 'member@parkease.com',
      password: passwordHashMember,
      phone: '9833445566',
      plate: 'DL 03 EF 3003',
      role: 'USER',
      membership: {
        type: 'PREMIUM',
        expiresAt: oneYearLater,
        joinedAt: new Date(),
        advanceDays: 7,
        discountPercent: 20
      },
      vehicles: [
        { plate: 'DL 03 EF 3003', type: 'Car', model: 'Hyundai Ioniq 5', isPrimary: true },
        { plate: 'DL 03 EV 9999', type: 'EV', model: 'Tata Nexon EV', isPrimary: false }
      ]
    });

    const standardUser = await User.create({
      name: 'User 1',
      email: 'user@parkease.com',
      password: passwordHashUser,
      phone: '9811223344',
      plate: 'DL 01 AB 1001',
      role: 'USER',
      membership: {
        type: 'NORMAL',
        expiresAt: null,
        joinedAt: new Date(),
        advanceDays: 1,
        discountPercent: 0
      },
      vehicles: [
        { plate: 'DL 01 AB 1001', type: 'Car', model: 'Honda City', isPrimary: true },
        { plate: 'DL 01 BK 4400', type: 'Bike', model: 'Royal Enfield Hunter', isPrimary: false }
      ]
    });

    const standardUser2 = await User.create({
      name: 'User 2',
      email: 'user2@parkease.com',
      password: passwordHashUser,
      phone: '9822334455',
      plate: 'DL 02 CD 2002',
      role: 'USER',
      membership: {
        type: 'NORMAL',
        expiresAt: null,
        joinedAt: new Date(),
        advanceDays: 1,
        discountPercent: 0
      },
      vehicles: [
        { plate: 'DL 02 CD 2002', type: 'Car', model: 'Maruti Brezza', isPrimary: true }
      ]
    });

    console.log('Default accounts seeded (admin@parkease.com, member@parkease.com, user@parkease.com)');

    // 3. Floors
    await ParkingFloor.deleteMany({});
    const floorsData = [
      {
        key: 'b',
        name: 'Basement Level',
        prefix: 'B',
        vehicleType: 'Car',
        capacity: 36,
        hourlyRate: 40,
        tagline: 'Covered · Standard & SUV',
        levelIndex: 0
      },
      {
        key: 'f',
        name: 'First Floor',
        prefix: 'F',
        vehicleType: 'Bike',
        capacity: 24,
        hourlyRate: 15,
        tagline: 'Two Wheeler · Secure Bays',
        levelIndex: 1
      },
      {
        key: 's',
        name: 'Second Floor',
        prefix: 'S',
        vehicleType: 'EV',
        capacity: 24,
        hourlyRate: 35,
        tagline: 'EV Fast Charging · Priority',
        levelIndex: 2
      }
    ];
    await ParkingFloor.insertMany(floorsData);
    console.log('Floors seeded: Basement (36), First (24), Second (24)');

    // 4. Slots
    await ParkingSlot.deleteMany({});
    const slots = [];
    const locationName = 'City Center Mall';

    // Basement: 36 car slots (B1 to B36)
    for (let i = 1; i <= 36; i++) {
      let landmark = 'Central Bay';
      let distanceScore = 3;
      if (i <= 6) {
        landmark = 'Near Elevator Lobby';
        distanceScore = 1;
      } else if (i <= 12) {
        landmark = 'Pillar C3 & Ramp';
        distanceScore = 2;
      } else if (i >= 25 && i <= 30) {
        landmark = 'South Staircase';
        distanceScore = 2;
      } else if (i > 30) {
        landmark = 'East Exit Bay';
        distanceScore = 4;
      }

      slots.push({
        slotId: `B${i}`,
        floorKey: 'b',
        floorName: 'Basement Level',
        locationName,
        vehicleType: 'Car',
        slotNumber: i,
        pricePerHour: 40,
        hasEVCharging: false,
        landmark,
        distanceScore,
        row: Math.ceil(i / 6),
        column: ((i - 1) % 6) + 1,
        isUnderMaintenance: i === 35, // Slot B35 under maintenance as demo
        maintenanceReason: i === 35 ? 'Sensors calibration in progress' : ''
      });
    }

    // First Floor: 24 bike slots (F1 to F24)
    for (let i = 1; i <= 24; i++) {
      let landmark = 'Central Two-Wheeler Bay';
      let distanceScore = 2;
      if (i <= 6) {
        landmark = 'Near Bike Entry Ramp';
        distanceScore = 1;
      } else if (i <= 12) {
        landmark = 'Locker & Helmet Stations';
        distanceScore = 2;
      } else if (i > 18) {
        landmark = 'Security Guard Kiosk';
        distanceScore = 3;
      }

      slots.push({
        slotId: `F${i}`,
        floorKey: 'f',
        floorName: 'First Floor',
        locationName,
        vehicleType: 'Bike',
        slotNumber: i,
        pricePerHour: 15,
        hasEVCharging: false,
        landmark,
        distanceScore,
        row: Math.ceil(i / 6),
        column: ((i - 1) % 6) + 1,
        isUnderMaintenance: false
      });
    }

    // Second Floor: 24 EV slots (S1 to S24)
    for (let i = 1; i <= 24; i++) {
      let landmark = 'EV Fast Charger 22 kW';
      let distanceScore = 2;
      if (i <= 6) {
        landmark = 'Near Elevator & Skywalk Entrance';
        distanceScore = 1;
      } else if (i <= 12) {
        landmark = 'EV Ultra-Fast 50 kW DC Bay';
        distanceScore = 1;
      } else if (i > 18) {
        landmark = 'North Charging Pavilion';
        distanceScore = 3;
      }

      slots.push({
        slotId: `S${i}`,
        floorKey: 's',
        floorName: 'Second Floor',
        locationName,
        vehicleType: 'EV',
        slotNumber: i,
        pricePerHour: 35,
        hasEVCharging: true,
        chargingPower: i <= 12 ? '50 kW DC Fast' : '22 kW AC Fast',
        landmark,
        distanceScore,
        row: Math.ceil(i / 6),
        column: ((i - 1) % 6) + 1,
        isUnderMaintenance: false
      });
    }

    await ParkingSlot.insertMany(slots);
    console.log(`Parking slots seeded: ${slots.length} (36 Car + 24 Bike + 24 EV)`);

    // 5. Initial Bookings (matches original scenario and provides live active session)
    await Booking.deleteMany({});
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const start1 = new Date(now);
    start1.setHours(start1.getHours() - 1, 0, 0, 0);
    const end1 = new Date(start1);
    end1.setHours(end1.getHours() + 3);

    const qr1 = await generateQRCodeDataURL({
      bookingId: 'PK-1001',
      slot: 'B4',
      plate: 'DL 01 AB 1001',
      user: standardUser.name
    });

    const booking1 = await Booking.create({
      bookingId: 'PK-1001',
      user: standardUser._id,
      userName: standardUser.name,
      userEmail: standardUser.email,
      userPhone: standardUser.phone,
      vehiclePlate: 'DL 01 AB 1001',
      vehicleType: 'Car',
      location: locationName,
      floorKey: 'b',
      floorName: 'Basement Level',
      slotId: 'B4',
      dateStr: todayStr,
      startTime: start1,
      endTime: end1,
      durationHours: 3,
      hourlyRate: 40,
      subtotal: 120,
      discountAmount: 0,
      totalAmount: 120,
      isMemberBooking: false,
      paymentStatus: 'paid',
      paymentDetails: {
        orderId: 'order_test_1001',
        paymentId: 'pay_test_1001',
        method: 'Razorpay UPI',
        paidAt: start1
      },
      bookingStatus: 'active',
      entryGateTime: start1,
      qrCodeData: qr1,
      landmark: 'Near Elevator Lobby',
      notes: 'Active parking session inside basement garage'
    });

    // Booking 2: Upcoming reservation for User 2 on B4 after booking1 ends
    const start2 = new Date(end1);
    const end2 = new Date(start2);
    end2.setHours(end2.getHours() + 2);

    const qr2 = await generateQRCodeDataURL({
      bookingId: 'PK-1002',
      slot: 'B4',
      plate: 'DL 02 CD 2002',
      user: standardUser2.name
    });

    await Booking.create({
      bookingId: 'PK-1002',
      user: standardUser2._id,
      userName: standardUser2.name,
      userEmail: standardUser2.email,
      userPhone: standardUser2.phone,
      vehiclePlate: 'DL 02 CD 2002',
      vehicleType: 'Car',
      location: locationName,
      floorKey: 'b',
      floorName: 'Basement Level',
      slotId: 'B4',
      dateStr: todayStr,
      startTime: start2,
      endTime: end2,
      durationHours: 2,
      hourlyRate: 40,
      subtotal: 80,
      discountAmount: 0,
      totalAmount: 80,
      isMemberBooking: false,
      paymentStatus: 'paid',
      paymentDetails: {
        orderId: 'order_test_1002',
        paymentId: 'pay_test_1002',
        method: 'Razorpay Card',
        paidAt: new Date()
      },
      bookingStatus: 'confirmed',
      qrCodeData: qr2,
      landmark: 'Near Elevator Lobby',
      notes: 'Upcoming reservation (next slot user)'
    });

    // Booking 3: Member booking on EV slot S3 with 20% membership discount applied!
    const start3 = new Date(now);
    start3.setHours(start3.getHours(), 0, 0, 0);
    const end3 = new Date(start3);
    end3.setHours(end3.getHours() + 4);

    const qr3 = await generateQRCodeDataURL({
      bookingId: 'PK-1003',
      slot: 'S3',
      plate: 'DL 03 EF 3003',
      user: premiumMember.name
    });

    await Booking.create({
      bookingId: 'PK-1003',
      user: premiumMember._id,
      userName: premiumMember.name,
      userEmail: premiumMember.email,
      userPhone: premiumMember.phone,
      vehiclePlate: 'DL 03 EF 3003',
      vehicleType: 'EV',
      location: locationName,
      floorKey: 's',
      floorName: 'Second Floor',
      slotId: 'S3',
      dateStr: todayStr,
      startTime: start3,
      endTime: end3,
      durationHours: 4,
      hourlyRate: 35,
      subtotal: 140,
      discountAmount: 28, // 20% discount
      totalAmount: 112,
      isMemberBooking: true,
      paymentStatus: 'paid',
      paymentDetails: {
        orderId: 'order_test_1003',
        paymentId: 'pay_test_1003',
        method: 'Razorpay NetBanking',
        paidAt: start3
      },
      bookingStatus: 'active',
      entryGateTime: start3,
      qrCodeData: qr3,
      landmark: 'Near Elevator & Skywalk Entrance',
      notes: 'VIP EV Member parking session'
    });

    // Initial Notifications
    await Notification.deleteMany({});
    await Notification.create([
      {
        user: standardUser._id,
        title: 'Booking Confirmed (PK-1001)',
        message: 'Your slot B4 at City Center Mall is reserved. Entry pass is ready.',
        type: 'booking',
        relatedId: 'PK-1001'
      },
      {
        user: standardUser._id,
        title: 'Gate Pass Active',
        message: 'You have checked into Slot B4 via North Gate Barrier 01.',
        type: 'gate',
        relatedId: 'PK-1001'
      },
      {
        user: premiumMember._id,
        title: 'Premium Member 20% Discount Applied',
        message: 'You saved ₹28 on your reservation at Slot S3 with ParkEase Premium.',
        type: 'membership',
        relatedId: 'PK-1003'
      }
    ]);

    console.log('Seed data completed successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

module.exports = seedInitialData;
