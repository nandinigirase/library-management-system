const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const Student = require('../models/Student');
const Book = require('../models/Book');
const { isAuthenticated } = require('../middleware/auth');

// GET Reports & Audit Page
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const { status, department, startDate, endDate } = req.query;
        const filter = {};

        if (status && status !== 'All') {
            filter.status = status;
        }

        if (startDate || endDate) {
            filter.issueDate = {};
            if (startDate) {
                filter.issueDate.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.issueDate.$lte = end;
            }
        }

        let issues = await Issue.find(filter)
            .populate('book', 'title isbn callNumber')
            .populate('student', 'studentId fullName department phone')
            .sort({ issueDate: -1 });

        // Filter by student department if specified
        if (department && department !== 'All') {
            issues = issues.filter(item => item.student && item.student.department === department);
        }

        // Compute summary metrics for filtered set
        let totalIssued = 0;
        let totalReturned = 0;
        let totalOverdue = 0;
        let totalFineRecorded = 0;
        let totalFineCollected = 0;

        issues.forEach(item => {
            if (item.status === 'ISSUED') totalIssued++;
            if (item.status === 'RETURNED') totalReturned++;
            if (item.status === 'OVERDUE') totalOverdue++;
            if (item.fineAmount > 0) {
                totalFineRecorded += item.fineAmount;
                if (item.finePaid) totalFineCollected += item.fineAmount;
            }
        });

        res.render('reports/index', {
            title: 'Audit Reports & Analytics - IMRD Library',
            issues,
            filters: {
                status: status || 'All',
                department: department || 'All',
                startDate: startDate || '',
                endDate: endDate || ''
            },
            summary: {
                totalTransactions: issues.length,
                totalIssued,
                totalReturned,
                totalOverdue,
                totalFineRecorded,
                totalFineCollected
            }
        });
    } catch (err) {
        console.error('Error generating report:', err);
        req.flash('error', 'Failed to generate audit report.');
        res.redirect('/dashboard');
    }
});

// GET Export Report to CSV
router.get('/export-csv', isAuthenticated, async (req, res) => {
    try {
        const issues = await Issue.find()
            .populate('book', 'title isbn callNumber')
            .populate('student', 'studentId fullName department phone')
            .sort({ issueDate: -1 });

        let csv = 'Transaction ID,Book Title,ISBN,Call Number,Student Name,Student ID,Department,Issue Date,Due Date,Return Date,Status,Fine Amount (INR),Fine Paid\n';

        issues.forEach(i => {
            const txId = i._id.toString();
            const bookTitle = `"${(i.book?.title || 'Unknown').replace(/"/g, '""')}"`;
            const isbn = `"${i.book?.isbn || ''}"`;
            const callNumber = `"${i.book?.callNumber || ''}"`;
            const studentName = `"${(i.student?.fullName || 'Unknown').replace(/"/g, '""')}"`;
            const studentId = `"${i.student?.studentId || ''}"`;
            const dept = `"${i.student?.department || ''}"`;
            const issueDate = i.issueDate ? i.issueDate.toISOString().split('T')[0] : '';
            const dueDate = i.dueDate ? i.dueDate.toISOString().split('T')[0] : '';
            const returnDate = i.returnDate ? i.returnDate.toISOString().split('T')[0] : 'Not Returned';
            const status = i.status;
            const fine = i.fineAmount || 0;
            const finePaid = i.finePaid ? 'YES' : 'NO';

            csv += `${txId},${bookTitle},${isbn},${callNumber},${studentName},${studentId},${dept},${issueDate},${dueDate},${returnDate},${status},${fine},${finePaid}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="IMRD_Library_Circulation_Report.csv"');
        res.status(200).send(csv);
    } catch (err) {
        console.error('Error exporting CSV:', err);
        req.flash('error', 'Failed to export CSV report.');
        res.redirect('/reports');
    }
});

module.exports = router;
