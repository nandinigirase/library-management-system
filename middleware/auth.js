// Middleware to protect routes that require admin authentication
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.admin) {
        return next();
    }
    req.flash('error', 'Session expired or not authenticated. Please log in.');
    res.redirect('/login');
};

// Middleware to prevent logged-in admins from accessing login page
const isGuest = (req, res, next) => {
    if (req.session && req.session.admin) {
        return res.redirect('/dashboard');
    }
    next();
};

// Global context middleware to attach user, flash, and branding to all views
const setGlobalLocals = (req, res, next) => {
    res.locals.currentAdmin = req.session.admin || null;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.info = req.flash('info');
    res.locals.currentPath = req.path;
    res.locals.instituteName = process.env.INSTITUTE_NAME || 'INSTITUTE OF MANAGEMENT RESEARCH & DEVELOPMENT, SHAHADA';
    res.locals.instituteShort = process.env.INSTITUTE_SHORT || 'IMRD Shahada';
    res.locals.instituteLocation = process.env.INSTITUTE_LOCATION || 'Shahada, Dist. Nandurbar';
    next();
};

module.exports = {
    isAuthenticated,
    isGuest,
    setGlobalLocals
};
