const mongoose = require('mongoose');
const crypto = require('crypto');

const DeviceSchema = new mongoose.Schema({
    deviceId: {
        type: String,
        required: true,
        unique: true,
        default: () => crypto.randomBytes(8).toString('hex')
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastDataReceived: {
        type: Date,
        default: null
    },
    latestData: {
        temperature: Number,
        humidity: Number,
        pressure: Number,
        rainValue: Number,
        rainDetected: Boolean,
        forecastRain: Boolean,
        timestamp: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    }
});

// Update the updatedAt field on save
DeviceSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Device', DeviceSchema);