const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const { isAuthenticated, isGuest } = require('../middleware/auth');

// GET Login Page
router.get('/login', isGuest, (req, res) => {
    res.render('auth/login', {
        title: 'Librarian Login - IMRD Shahada'
    });
});

// POST Login
router.post('/login', isGuest, async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            req.flash('error', 'Please provide both username and password.');
            return res.redirect('/login');
        }

        const admin = await Admin.findOne({ username: username.toLowerCase().trim() });
        if (!admin) {
            req.flash('error', 'Invalid username or password.');
            return res.redirect('/login');
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            req.flash('error', 'Invalid username or password.');
            return res.redirect('/login');
        }

        // Update last login
        admin.lastLogin = new Date();
        await admin.save();

        // Save session
        req.session.admin = {
            id: admin._id,
            username: admin.username,
            fullName: admin.fullName,
            email: admin.email,
            role: admin.role,
            staffId: admin.staffId
        };

        req.flash('success', `Welcome back, ${admin.fullName}! Successfully authenticated.`);
        res.redirect('/dashboard');
    } catch (err) {
        console.error('Login error:', err);
        req.flash('error', 'An error occurred during login. Please try again.');
        res.redirect('/login');
    }
});

// GET Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Logout error:', err);
        res.redirect('/login');
    });
});

// GET Admin Profile
router.get('/profile', isAuthenticated, async (req, res) => {
    try {
        const admin = await Admin.findById(req.session.admin.id);
        res.render('auth/profile', {
            title: 'Staff Profile & Settings - IMRD Shahada',
            admin
        });
    } catch (err) {
        req.flash('error', 'Could not load profile.');
        res.redirect('/dashboard');
    }
});

// POST Update Profile Details
router.post('/profile', isAuthenticated, async (req, res) => {
    try {
        const { fullName, email, phone, role } = req.body;
        const admin = await Admin.findById(req.session.admin.id);

        if (!admin) {
            req.flash('error', 'Admin not found.');
            return res.redirect('/login');
        }

        admin.fullName = fullName || admin.fullName;
        admin.email = email || admin.email;
        admin.phone = phone || admin.phone;
        if (role) admin.role = role;

        await admin.save();

        // Update session info
        req.session.admin.fullName = admin.fullName;
        req.session.admin.email = admin.email;
        req.session.admin.role = admin.role;

        req.flash('success', 'Profile details updated successfully.');
        res.redirect('/profile');
    } catch (err) {
        console.error('Profile update error:', err);
        req.flash('error', 'Failed to update profile: ' + err.message);
        res.redirect('/profile');
    }
});

// POST Change Password
router.post('/profile/change-password', isAuthenticated, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const admin = await Admin.findById(req.session.admin.id);

        if (!admin) {
            req.flash('error', 'Admin not found.');
            return res.redirect('/login');
        }

        const isMatch = await admin.comparePassword(currentPassword);
        if (!isMatch) {
            req.flash('error', 'Current password entered is incorrect.');
            return res.redirect('/profile');
        }

        if (newPassword.length < 6) {
            req.flash('error', 'New password must be at least 6 characters long.');
            return res.redirect('/profile');
        }

        if (newPassword !== confirmPassword) {
            req.flash('error', 'New passwords do not match.');
            return res.redirect('/profile');
        }

        admin.password = newPassword; // Will be hashed in pre('save')
        await admin.save();

        req.flash('success', 'Password changed successfully! Keep your credentials secure.');
        res.redirect('/profile');
    } catch (err) {
        console.error('Password change error:', err);
        req.flash('error', 'Failed to change password: ' + err.message);
        res.redirect('/profile');
    }
});

module.exports = router;
