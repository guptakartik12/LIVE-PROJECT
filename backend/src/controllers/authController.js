const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'parkease_super_secret_jwt_key_2025_secure_smart_parking', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, phone, plate, vehicleType } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      plate: plate ? plate.toUpperCase() : 'DL 01 AB 1001',
      vehicles: plate ? [{ plate: plate.toUpperCase(), type: vehicleType || 'Car', isPrimary: true }] : [],
      role: 'USER',
      membership: {
        type: 'NORMAL',
        expiresAt: null,
        joinedAt: new Date(),
        advanceDays: 1,
        discountPercent: 0
      }
    });

    await Notification.create({
      user: user._id,
      title: 'Welcome to ParkEase!',
      message: 'Your smart parking account is active. Find, reserve, and park seamlessly.',
      type: 'system'
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        plate: user.plate,
        role: user.role,
        membership: user.membership,
        vehicles: user.vehicles
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        plate: user.plate,
        role: user.role,
        membership: user.membership,
        vehicles: user.vehicles
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        plate: user.plate,
        role: user.role,
        membership: user.membership,
        vehicles: user.vehicles
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile & vehicles
// @route   PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, plate, vehicles } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (plate) user.plate = plate.toUpperCase();
    if (vehicles && Array.isArray(vehicles)) user.vehicles = vehicles;

    await user.save();

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        plate: user.plate,
        role: user.role,
        membership: user.membership,
        vehicles: user.vehicles
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upgrade to Premium Membership
// @route   POST /api/auth/upgrade-membership
const upgradeMembership = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    user.membership = {
      type: 'PREMIUM',
      expiresAt: expiryDate,
      joinedAt: new Date(),
      advanceDays: 7,
      discountPercent: 20
    };

    await user.save();

    await Notification.create({
      user: user._id,
      title: 'Premium Membership Activated!',
      message: 'Welcome to ParkEase VIP! Enjoy 7-day advance booking and 20% discount on all bays.',
      type: 'membership'
    });

    return res.json({
      success: true,
      message: 'Membership upgraded to Premium successfully!',
      membership: user.membership
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forgot Password Workflow (Reset code simulator)
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide email' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't disclose if account exists for security
      return res.json({
        success: true,
        message: 'If an account exists with this email, password reset instructions have been sent.'
      });
    }

    // In a production system, a cryptographic token is emailed.
    // For local evaluation, we simulate sending the instruction.
    return res.json({
      success: true,
      message: 'Password reset link sent to your email. Check your inbox.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  upgradeMembership,
  forgotPassword
};
