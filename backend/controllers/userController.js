const User = require('../models/User');

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        // Check if the requester is an admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }

        const users = await User.find().select('-password');
        return res.status(200).json(users);
    } catch (error) {
        console.error('Get all users error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Get user by ID
exports.getUserById = async (req, res) => {
    try {
        // Check if the requester is an admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }

        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json(user);
    } catch (error) {
        console.error('Get user by ID error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Update user
exports.updateUser = async (req, res) => {
    try {
        // Check if the requester is an admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }

        const { firstname, email, role } = req.body;
        
        // Validate input
        if (!firstname || !email || !role) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if user exists
        let user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if email is already taken by another user
        const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email is already taken' });
        }

        // Update user
        user.firstname = firstname;
        user.email = email;
        user.role = role;

        await user.save();

        return res.status(200).json({
            message: 'User updated successfully',
            user: {
                id: user._id,
                firstname: user.firstname,
                email: user.email,
                role: user.role,
                passwordChanged: user.passwordChanged,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Update user error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        // Check if the requester is an admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }

        // Check if user exists
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete user
        await User.findByIdAndDelete(req.params.id);

        return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Get users by date range for reports
exports.getUsersByDateRange = async (req, res) => {
    try {
        // Check if the requester is an admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }

        const { startDate, endDate } = req.query;
        
        // Validate input
        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start date and end date are required' });
        }

        // Convert string dates to Date objects
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Set end date to end of day
        end.setHours(23, 59, 59, 999);

        // Find users created between start and end dates
        const users = await User.find({
            createdAt: { $gte: start, $lte: end }
        }).select('-password');

        return res.status(200).json(users);
    } catch (error) {
        console.error('Get users by date range error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};