// Middleware for validating signup and login input
const jwt = require('jsonwebtoken');

module.exports = {
    validateSignup: (req, res, next) => {
        const { firstname, email, password } = req.body;
        if (!firstname || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        // Basic email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }
        next();
    },

    validateLogin: (req, res, next) => {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        next();
    },

    // JWT authentication middleware
    authenticateJWT: (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = { 
                id: decoded.userId,
                role: decoded.role 
            };
            next();
        } catch (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }
    },

    // Admin authorization middleware
    isAdmin: (req, res, next) => {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }
    },

    // Validate admin registration input
    validateAdminRegister: (req, res, next) => {
        const { firstname, email } = req.body;
        if (!firstname || !email) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        // Basic email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        next();
    },

    // Validate password change input
    validatePasswordChange: (req, res, next) => {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }
        next();
    }
};
