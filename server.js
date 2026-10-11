require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const morgan = require('morgan');

const connectDB = require('./config/db');
const seedDatabase = require('./seed/seedData');
const { setGlobalLocals } = require('./middleware/auth');

// Initialize Express App
const app = express();

// Connect to Database & Seed Initial Data
connectDB().then(() => {
    seedDatabase();
});

// Template Engine Configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'imrd_shahada_secret_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        httpOnly: true
    }
}));

// Flash Notifications
app.use(flash());

// Inject Context into all views
app.use(setGlobalLocals);

// Routes Registration
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/dashboard'));
app.use('/books', require('./routes/books'));
app.use('/students', require('./routes/students'));
app.use('/members', require('./routes/students'));
app.use('/circulation', require('./routes/circulation'));
app.use('/reports', require('./routes/reports'));

// 404 Page Handler
app.use((req, res) => {
    res.status(404).render('404', {
        title: 'Page Not Found - IMRD Library'
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Application Error:', err);
    res.status(500).render('404', {
        title: 'Application Error - IMRD Library',
        errorMessage: err.message
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🏛️  IMRD SHAHADA - LIBRARY MANAGEMENT SYSTEM`);
    console.log(`🚀  Server running on http://localhost:${PORT}`);
    console.log(`📖  Admin Login: admin / admin123`);
    console.log(`====================================================`);
});
