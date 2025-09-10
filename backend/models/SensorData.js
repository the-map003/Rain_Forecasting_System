const mongoose = require('mongoose');

const SensorDataSchema = new mongoose.Schema({
    deviceId: {
        type: String,
        required: true,
        index: true
    },
    temperature: {
        type: Number,
        required: true
    },
    humidity: {
        type: Number,
        required: true
    },
    pressure: {
        type: Number,
        required: true
    },
    rainValue: {
        type: Number,
        required: true
    },
    rainDetected: {
        type: Boolean,
        required: true
    },
    forecastRain: {
        type: Boolean,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Index for efficient queries by device and date range
SensorDataSchema.index({ deviceId: 1, timestamp: -1 });

module.exports = mongoose.model('SensorData', SensorDataSchema);
