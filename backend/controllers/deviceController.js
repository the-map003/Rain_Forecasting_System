const Device = require('../models/Device');
const mqttService = require('../services/mqttService');

// @desc    Register a new device
// @route   POST /api/devices
// @access  Private
exports.registerDevice = async (req, res) => {
    try {
        const { phoneNumber, name } = req.body;

        // Validate required fields
        if (!phoneNumber || !name) {
            return res.status(400).json({ 
                success: false, 
                message: 'Phone number and name are required' 
            });
        }

        // Create new device (deviceId is auto-generated in the model)
        const device = await Device.create({
            phoneNumber,
            name,
            userId: req.user ? req.user.id : null
        });

        // Send device configuration via MQTT
        try {
            await mqttService.configureDevice(device.deviceId);
            console.log(`Configuration sent to device ${device.deviceId}`);
        } catch (mqttError) {
            console.error('Error sending MQTT configuration:', mqttError);
            // Don't fail the registration if MQTT fails
        }

        res.status(201).json({
            success: true,
            data: device
        });
    } catch (error) {
        console.error('Error registering device:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get all devices
// @route   GET /api/devices
// @access  Private
exports.getDevices = async (req, res) => {
    try {
        const devices = await Device.find();
        
        res.status(200).json({
            success: true,
            count: devices.length,
            data: devices
        });
    } catch (error) {
        console.error('Error fetching devices:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get single device
// @route   GET /api/devices/:id
// @access  Private
exports.getDevice = async (req, res) => {
    try {
        const { id } = req.params;
        let device;

        // Handle special case for 'latest-data' ID
        if (id === 'latest-data') {
            device = await Device.findOne().sort({ lastDataReceived: -1 });
            
            if (!device) {
                return res.status(404).json({
                    success: false,
                    message: 'No devices found'
                });
            }
        } else {
            // Normal device lookup by ID
            device = await Device.findById(id);

            if (!device) {
                return res.status(404).json({
                    success: false,
                    message: 'Device not found'
                });
            }
        }

        res.status(200).json({
            success: true,
            data: device
        });
    } catch (error) {
        console.error('Error fetching device:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get device by deviceId
// @route   GET /api/devices/deviceId/:deviceId
// @access  Private
exports.getDeviceByDeviceId = async (req, res) => {
    try {
        const device = await Device.findOne({ deviceId: req.params.deviceId });

        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Device not found'
            });
        }

        res.status(200).json({
            success: true,
            data: device
        });
    } catch (error) {
        console.error('Error fetching device by deviceId:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update device
// @route   PUT /api/devices/:id
// @access  Private
exports.updateDevice = async (req, res) => {
    try {
        const { phoneNumber, name, isActive } = req.body;
        
        let device = await Device.findById(req.params.id);

        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Device not found'
            });
        }

        // Update fields
        device = await Device.findByIdAndUpdate(
            req.params.id,
            { phoneNumber, name, isActive, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: device
        });
    } catch (error) {
        console.error('Error updating device:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete device
// @route   DELETE /api/devices/:id
// @access  Private
exports.deleteDevice = async (req, res) => {
    try {
        const device = await Device.findById(req.params.id);

        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Device not found'
            });
        }

        await device.remove();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error deleting device:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update device last data received timestamp
// @route   PUT /api/devices/:deviceId/data-received
// @access  Public (for MQTT service)
exports.updateLastDataReceived = async (req, res) => {
    try {
        const device = await Device.findOne({ deviceId: req.params.deviceId });

        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Device not found'
            });
        }

        device.lastDataReceived = Date.now();
        await device.save();

        res.status(200).json({
            success: true,
            data: device
        });
    } catch (error) {
        console.error('Error updating last data received:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Configure device via MQTT
// @route   POST /api/devices/configure-mqtt
// @access  Private
exports.configureDeviceViaMQTT = async (req, res) => {
    try {
        const { deviceId } = req.body;
        const mqttService = require('../services/mqttService');

        if (!deviceId) {
            return res.status(400).json({
                success: false,
                message: 'Device ID is required'
            });
        }

        // Send configuration via MQTT
        await mqttService.configureDevice(deviceId);

        res.status(200).json({
            success: true,
            message: 'Configuration sent to device via MQTT'
        });
    } catch (error) {
        console.error('Error configuring device via MQTT:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send MQTT configuration',
            error: error.message
        });
    }
};

// @desc    Get latest data for all devices
// @route   GET /api/devices/last-data
// @access  Private
exports.getAllDevicesLastData = async (req, res) => {
    try {
        const devices = await Device.find();
        // Create a dictionary keyed by deviceId for easier frontend merge
        const data = {};
        devices.forEach(device => {
            data[device.deviceId] = device;
        });
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching all devices last data:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch devices last data' });
    }
};

// @desc    Get real-time device data
// @route   GET /api/devices/realtime-data
// @access  Private
exports.getRealtimeDeviceData = async (req, res) => {
    try {
        const devices = await Device.find({ isActive: true }).select('deviceId name latestData lastDataReceived');
        
        const deviceData = {};
        devices.forEach(device => {
            if (device.latestData) {
                deviceData[device.deviceId] = {
                    ...device.latestData.toObject(),
                    deviceName: device.name,
                    lastUpdate: device.lastDataReceived
                };
            }
        });
        
        res.status(200).json({
            success: true,
            data: deviceData
        });
    } catch (error) {
        console.error('Error fetching realtime device data:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get historical sensor data for reports
// @route   GET /api/devices/historical-data
// @access  Private
exports.getHistoricalSensorData = async (req, res) => {
    try {
        const { deviceId, startDate, endDate } = req.query;
        
        // Build query based on parameters
        const query = {};
        
        // Filter by device if specified
        if (deviceId && deviceId !== 'all') {
            query.deviceId = deviceId;
        }
        
        // Filter by date range if specified
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) {
                query.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                // Set endDate to end of day
                const endDateTime = new Date(endDate);
                endDateTime.setHours(23, 59, 59, 999);
                query.timestamp.$lte = endDateTime;
            }
        }
        
        // Get SensorData model
        const SensorData = require('../models/SensorData');
        
        // Fetch data with pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 1000;
        const skip = (page - 1) * limit;
        
        // Get data and total count
        const data = await SensorData.find(query)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);
            
        const total = await SensorData.countDocuments(query);
        
        // Get device information to include in response
        const devices = await Device.find();
        const deviceMap = {};
        devices.forEach(device => {
            deviceMap[device.deviceId] = {
                name: device.name,
                _id: device._id
            };
        });
        
        // Calculate summary statistics
        const stats = {
            totalRecords: total,
            avgTemperature: 0,
            avgHumidity: 0,
            avgPressure: 0,
            rainEvents: 0
        };
        
        if (data.length > 0) {
            // Calculate averages
            const tempSum = data.reduce((sum, record) => sum + record.temperature, 0);
            const humiditySum = data.reduce((sum, record) => sum + record.humidity, 0);
            const pressureSum = data.reduce((sum, record) => sum + record.pressure, 0);
            const rainEvents = data.filter(record => record.rainDetected).length;
            
            stats.avgTemperature = (tempSum / data.length).toFixed(1);
            stats.avgHumidity = (humiditySum / data.length).toFixed(1);
            stats.avgPressure = (pressureSum / data.length).toFixed(1);
            stats.rainEvents = rainEvents;
        }
        
        res.status(200).json({
            success: true,
            data: {
                records: data,
                stats,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                },
                deviceMap
            }
        });
    } catch (error) {
        console.error('Error fetching historical sensor data:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};