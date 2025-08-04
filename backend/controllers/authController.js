const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Signup controller
exports.signup = async (req, res) => {
    const { firstname, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({ firstname, email, password: hashedPassword });
        await user.save();
        return res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Signup error:', err); // ✅ Add this line
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
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        return res.json({ token, user: { firstname: user.firstname, email: user.email } });
    } catch (err) {
        return res.status(500).json({ message: 'Server error' });
    }
};

//get user info
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
        });
    }catch(error){
        res.status(500).json({ message: 'Error getting user info', error: error.message });
    }
};
