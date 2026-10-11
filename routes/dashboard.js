const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Student = require('../models/Student');
const Issue = require('../models/Issue');
const { isAuthenticated } = require('../middleware/auth');

// Helper to check and mark overdue issues dynamically
const updateOverdueStatuses = async () => {
    try {
        const ratePerDay = parseInt(process.env.FINE_PER_DAY, 10) || 5;
        const now = new Date();

        const pendingIssues = await Issue.find({
            status: { $in: ['ISSUED', 'OVERDUE'] },
            returnDate: null
        });

        for (const issue of pendingIssues) {
            if (now > issue.dueDate) {
                const diffTime = Math.abs(now - issue.dueDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                issue.status = 'OVERDUE';
                issue.fineAmount = diffDays * ratePerDay;
                await issue.save();
            }
        }
    } catch (err) {
        console.error('Error auto-updating overdues:', err);
    }
};

// GET Dashboard
router.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        await updateOverdueStatuses();

        // 1. Core Summary Metrics
        const totalTitles = await Book.countDocuments();
        
        // Sum totalCopies and availableCopies
        const bookCopyAggregation = await Book.aggregate([
            {
                $group: {
                    _id: null,
                    totalCopies: { $sum: '$totalCopies' },
                    availableCopies: { $sum: '$availableCopies' }
                }
            }
        ]);

        const totalCopies = bookCopyAggregation[0]?.totalCopies || 0;
        const availableCopies = bookCopyAggregation[0]?.availableCopies || 0;

        const totalStudents = await Student.countDocuments();
        const activeStudents = await Student.countDocuments({ status: 'Active' });

        const issuedBooksCount = await Issue.countDocuments({ status: 'ISSUED' });
        const overdueBooksCount = await Issue.countDocuments({ status: 'OVERDUE' });
        const returnedBooksCount = await Issue.countDocuments({ status: 'RETURNED' });

        // Fine metrics
        const fineAggregation = await Issue.aggregate([
            {
                $group: {
                    _id: '$finePaid',
                    totalFine: { $sum: '$fineAmount' }
                }
            }
        ]);

        let finesCollected = 0;
        let finesPending = 0;
        fineAggregation.forEach(item => {
            if (item._id === true) finesCollected = item.totalFine;
            if (item._id === false) finesPending = item.totalFine;
        });

        // 2. Books by Category (for Chart)
        const categoryCounts = await Book.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: '$totalCopies' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // 3. Department Wise Student Borrowing distribution
        const studentDeptCounts = await Student.aggregate([
            {
                $group: {
                    _id: '$department',
                    count: { $sum: 1 },
                    issued: { $sum: '$currentIssuedCount' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // 4. Overdue Alerts (top 5 urgent)
        const overdueAlerts = await Issue.find({ status: 'OVERDUE' })
            .populate('book', 'title isbn callNumber rackNumber')
            .populate('student', 'fullName studentId phone email department')
            .sort({ dueDate: 1 })
            .limit(5);

        // 5. Recent Circulation Activities (latest 7)
        const recentActivities = await Issue.find()
            .populate('book', 'title isbn callNumber coverColor')
            .populate('student', 'fullName studentId department')
            .sort({ updatedAt: -1 })
            .limit(7);

        res.render('dashboard/index', {
            title: 'Executive Dashboard - IMRD Library',
            stats: {
                totalTitles,
                totalCopies,
                availableCopies,
                totalStudents,
                activeStudents,
                issuedBooksCount,
                overdueBooksCount,
                returnedBooksCount,
                finesCollected,
                finesPending
            },
            categoryCounts,
            studentDeptCounts,
            overdueAlerts,
            recentActivities
        });
    } catch (err) {
        console.error('Dashboard loading error:', err);
        req.flash('error', 'Error loading dashboard statistics.');
        res.render('dashboard/index', {
            title: 'Executive Dashboard - IMRD Library',
            stats: {
                totalTitles: 0,
                totalCopies: 0,
                availableCopies: 0,
                totalStudents: 0,
                activeStudents: 0,
                issuedBooksCount: 0,
                overdueBooksCount: 0,
                returnedBooksCount: 0,
                finesCollected: 0,
                finesPending: 0
            },
            categoryCounts: [],
            studentDeptCounts: [],
            overdueAlerts: [],
            recentActivities: []
        });
    }
});

// Root URL redirect to dashboard
router.get('/', (req, res) => {
    if (req.session && req.session.admin) {
        return res.redirect('/dashboard');
    }
    res.redirect('/login');
});

module.exports = router;
