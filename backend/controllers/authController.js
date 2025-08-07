const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generatePassword } = require('../utils/passwordGenerator');

// Signup controller
exports.signup = async (req, res) => {
    const { firstname, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({ 
            firstname, 
            email, 
            password: hashedPassword,
            role: 'admin' // First user is admin by default
        });
        await user.save();
        return res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Signup error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Login controller
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ 
            userId: user._id,
            role: user.role 
        }, process.env.JWT_SECRET, { expiresIn: '1h' });
        return res.json({ 
            token, 
            user: { 
                firstname: user.firstname, 
                email: user.email,
                role: user.role,
                passwordChanged: user.passwordChanged
            } 
        });
    } catch (err) {
        return res.status(500).json({ message: 'Server error' });
    }
};

// Get user info
exports.getUserInfo = async (req, res) => {
    try{
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Return user info to client
        res.status(200).json({
            id: user._id,
            firstname: user.firstname,
            email: user.email,
            role: user.role,
            passwordChanged: user.passwordChanged
        });
    }catch(error){
        res.status(500).json({ message: 'Error getting user info', error: error.message });
    }
};

// Admin register new user
exports.adminRegisterUser = async (req, res) => {
    try {
        // Check if the requester is an admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }

        const { firstname, email } = req.body;

        // Validate input
        if (!firstname || !email) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Generate a default password
        const defaultPassword = generatePassword(10);
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        // Create new user with staff role
        const newUser = new User({
            firstname,
            email,
            password: hashedPassword,
            role: 'staff',
            passwordChanged: false
        });

        await newUser.save();

        // Return success with the generated password
        return res.status(201).json({
            message: 'User registered successfully',
            defaultPassword,
            user: {
                firstname: newUser.firstname,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('Admin register error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Change password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }
        
        // Get user
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password
        user.password = hashedPassword;
        user.passwordChanged = true;
        await user.save();
        
        return res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
