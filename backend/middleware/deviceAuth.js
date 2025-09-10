const Device = require('../models/Device');

module.exports = {
    // Middleware to validate device registration input
    validateDeviceRegistration: (req, res, next) => {
        const { phoneNumber, name } = req.body;
        
        if (!phoneNumber || !name) {
            return res.status(400).json({ 
                success: false, 
                message: 'Phone number and name are required' 
            });
        }
        
        // Basic phone number format validation
        const phoneRegex = /^\+?[0-9]{10,15}$/;
        if (!phoneRegex.test(phoneNumber.replace(/\s+/g, ''))) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid phone number format' 
            });
        }
        
        next();
    },
    
    // Middleware to verify device exists by deviceId
    verifyDevice: async (req, res, next) => {
        try {
            const deviceId = req.params.deviceId || req.body.deviceId;
            
            if (!deviceId) {
                return res.status(400).json({
                    success: false,
                    message: 'Device ID is required'
                });
            }
            
            const device = await Device.findOne({ deviceId });
            
            if (!device) {
                return res.status(404).json({
                    success: false,
                    message: 'Device not found'
                });
            }
            
            // Attach device to request object for use in controller
            req.device = device;
            next();
        } catch (error) {
            console.error('Error verifying device:', error);
            res.status(500).json({
                success: false,
                message: 'Server error',
                error: error.message
            });
        }
    },
    
    // Middleware to check if device is active
    isDeviceActive: async (req, res, next) => {
        // Device should be attached by verifyDevice middleware
        if (!req.device) {
            return res.status(400).json({
                success: false,
                message: 'Device not found in request'
            });
        }
        
        if (!req.device.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Device is inactive'
            });
        }
        
        next();
    }
};