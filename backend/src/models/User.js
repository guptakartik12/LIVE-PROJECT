const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false
    },
    phone: {
      type: String,
      default: ''
    },
    plate: {
      type: String,
      default: 'DL 01 AB 1001'
    },
    vehicles: [
      {
        plate: { type: String, required: true },
        type: { type: String, enum: ['Car', 'Bike', 'EV'], default: 'Car' },
        model: { type: String, default: '' },
        isPrimary: { type: Boolean, default: false }
      }
    ],
    role: {
      type: String,
      enum: ['USER', 'ADMIN'],
      default: 'USER'
    },
    membership: {
      type: {
        type: String,
        enum: ['NORMAL', 'PREMIUM'],
        default: 'NORMAL'
      },
      expiresAt: {
        type: Date,
        default: null
      },
      joinedAt: {
        type: Date,
        default: Date.now
      },
      advanceDays: {
        type: Number,
        default: 1
      },
      discountPercent: {
        type: Number,
        default: 0
      }
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
