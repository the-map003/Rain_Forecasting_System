const express = require('express');
const router = express.Router();
const { 
    registerDevice, 
    getDevices, 
    getDevice, 
    getDeviceByDeviceId,
    updateDevice, 
    deleteDevice,
    updateLastDataReceived,
    configureDeviceViaMQTT,
    getRealtimeDeviceData,
    getAllDevicesLastData,
    getHistoricalSensorData,
    getDeviceByPhoneNumber,
    getHistoricalSensorDataPublic
} = require('../controllers/deviceController');

const { authenticateJWT, isAdmin } = require('../middleware/authValidation');
const { validateDeviceRegistration, verifyDevice, isDeviceActive } = require('../middleware/deviceAuth');

// Routes that require authentication
router.route('/')
    .post(authenticateJWT, validateDeviceRegistration, registerDevice)
    .get(authenticateJWT, getDevices);

// Define specific routes first to avoid conflicts with parameterized routes

// Route to get real-time device data
router.route('/realtime-data')
    .get(authenticateJWT, getRealtimeDeviceData);

// Route to get last data for all devices
router.route('/last-data')
    .get(authenticateJWT, getAllDevicesLastData);

// Route to get historical sensor data for reports
router.route('/historical-data')
    .get(authenticateJWT, getHistoricalSensorData);

// Public routes for end-user portal
router.get('/public/by-phone/:phoneNumber', getDeviceByPhoneNumber);
router.get('/public/historical-data', getHistoricalSensorDataPublic);

// Route to get device by deviceId
router.route('/deviceId/:deviceId')
    .get(authenticateJWT, getDeviceByDeviceId);

// Route to configure device via MQTT
router.route('/configure-mqtt')
    .post(authenticateJWT, configureDeviceViaMQTT);

// Parameterized routes
router.route('/:id')
    .get(authenticateJWT, getDevice)
    .put(authenticateJWT, updateDevice)
    .delete(authenticateJWT, isAdmin, deleteDevice);

// Public route for MQTT service to update last data received
router.route('/:deviceId/data-received')
    .put(verifyDevice, updateLastDataReceived);

// Route to check if a device is active
router.route('/:deviceId/status')
    .get(verifyDevice, isDeviceActive, (req, res) => {
        res.status(200).json({
            success: true,
            message: 'Device is active',
            data: {
                deviceId: req.device.deviceId,
                isActive: req.device.isActive,
                lastDataReceived: req.device.lastDataReceived
            }
        });
    });

module.exports = router;