const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Student = require('../models/Student');
const Issue = require('../models/Issue');
const { isAuthenticated } = require('../middleware/auth');

// Helper to calculate overdue fine dynamically
const getOverdueInfo = (issue, ratePerDay = 5) => {
    const now = issue.returnDate ? new Date(issue.returnDate) : new Date();
    const dueDate = new Date(issue.dueDate);

    if (now > dueDate) {
        const diffTime = Math.abs(now - dueDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { overdueDays: diffDays, fine: diffDays * ratePerDay };
    }
    return { overdueDays: 0, fine: 0 };
};

// GET Issue Book Page
router.get('/issue', isAuthenticated, async (req, res) => {
    try {
        const { bookId, studentId } = req.query;

        // Fetch only books with stock available
        const books = await Book.find({ availableCopies: { $gt: 0 } }).sort({ title: 1 });
        
        // Fetch active students
        const students = await Student.find({ status: 'Active' }).sort({ fullName: 1 });

        const defaultLoanDays = parseInt(process.env.DEFAULT_LOAN_DAYS, 10) || 14;
        const defaultDueDate = new Date();
        defaultDueDate.setDate(defaultDueDate.getDate() + defaultLoanDays);

        res.render('circulation/issue', {
            title: 'Issue Book to Student - IMRD Library',
            books,
            students,
            preSelectedBookId: bookId || '',
            preSelectedStudentId: studentId || '',
            defaultDueDate: defaultDueDate.toISOString().split('T')[0],
            defaultLoanDays
        });
    } catch (err) {
        console.error('Error loading issue form:', err);
        req.flash('error', 'Could not open book issue page.');
        res.redirect('/dashboard');
    }
});

// POST Issue Book
router.post('/issue', isAuthenticated, async (req, res) => {
    try {
        const { bookId, studentId, dueDate, remarks } = req.body;

        if (!bookId || !studentId || !dueDate) {
            req.flash('error', 'Please select both a student and a book, and confirm the due date.');
            return res.redirect('/circulation/issue');
        }

        // Validate Book
        const book = await Book.findById(bookId);
        if (!book) {
            req.flash('error', 'Selected book was not found.');
            return res.redirect('/circulation/issue');
        }

        if (book.availableCopies <= 0) {
            req.flash('error', `"${book.title}" is currently out of stock. No copies available for issue.`);
            return res.redirect('/circulation/issue');
        }

        // Validate Student
        const student = await Student.findById(studentId);
        if (!student) {
            req.flash('error', 'Selected student was not found.');
            return res.redirect('/circulation/issue');
        }

        if (student.status !== 'Active') {
            req.flash('error', `Student "${student.fullName}" account is suspended.`);
            return res.redirect('/circulation/issue');
        }

        // Check if student has reached max allowed books
        const activeCount = await Issue.countDocuments({
            student: student._id,
            status: { $in: ['ISSUED', 'OVERDUE'] }
        });

        if (activeCount >= student.maxAllowedBooks) {
            req.flash('error', `Student ${student.fullName} has already reached maximum borrowing limit (${student.maxAllowedBooks} books). Return an existing book first.`);
            return res.redirect('/circulation/issue');
        }

        // Check if student already has this exact book currently issued
        const alreadyHasBook = await Issue.findOne({
            student: student._id,
            book: book._id,
            status: { $in: ['ISSUED', 'OVERDUE'] }
        });

        if (alreadyHasBook) {
            req.flash('error', `Student ${student.fullName} already has a copy of "${book.title}" currently issued.`);
            return res.redirect('/circulation/issue');
        }

        // Create Issue Record
        const newIssue = new Issue({
            book: book._id,
            student: student._id,
            issueDate: new Date(),
            dueDate: new Date(dueDate),
            status: 'ISSUED',
            remarks: remarks ? remarks.trim() : 'Issued via Library Circulation Desk',
            issuedBy: req.session.admin ? req.session.admin.fullName : 'Chief Librarian'
        });

        await newIssue.save();

        // Update book available copies
        book.availableCopies -= 1;
        await book.save();

        // Update student issued count
        student.currentIssuedCount = activeCount + 1;
        await student.save();

        req.flash('success', `Book "${book.title}" issued successfully to ${student.fullName}! Issue Slip ID: #${newIssue._id.toString().slice(-6).toUpperCase()}`);
        res.redirect(`/circulation/slip/${newIssue._id}`);
    } catch (err) {
        console.error('Issue book error:', err);
        req.flash('error', 'Error issuing book: ' + err.message);
        res.redirect('/circulation/issue');
    }
});

// GET Return Book Desk
router.get('/return', isAuthenticated, async (req, res) => {
    try {
        const { q } = req.query;
        const ratePerDay = parseInt(process.env.FINE_PER_DAY, 10) || 5;

        // Fetch active and overdue issues
        const issues = await Issue.find({ status: { $in: ['ISSUED', 'OVERDUE'] } })
            .populate('book', 'title isbn callNumber rackNumber coverColor')
            .populate('student', 'studentId fullName department phone')
            .sort({ dueDate: 1 });

        // Calculate up-to-date fine for each
        const decoratedIssues = issues.map(item => {
            const overdueInfo = getOverdueInfo(item, ratePerDay);
            return {
                ...item.toObject(),
                currentOverdueDays: overdueInfo.overdueDays,
                calculatedFine: overdueInfo.fine
            };
        });

        // Optional filter if search query provided
        let filteredIssues = decoratedIssues;
        if (q && q.trim()) {
            const term = q.trim().toLowerCase();
            filteredIssues = decoratedIssues.filter(item =>
                (item.book && item.book.title.toLowerCase().includes(term)) ||
                (item.book && item.book.callNumber.toLowerCase().includes(term)) ||
                (item.student && item.student.fullName.toLowerCase().includes(term)) ||
                (item.student && item.student.studentId.toLowerCase().includes(term))
            );
        }

        res.render('circulation/return', {
            title: 'Return Circulation Desk - IMRD Library',
            issues: filteredIssues,
            searchQuery: q || '',
            ratePerDay
        });
    } catch (err) {
        console.error('Error loading return desk:', err);
        req.flash('error', 'Failed to load circulation return list.');
        res.redirect('/dashboard');
    }
});

// POST Process Book Return
router.post('/return/:id', isAuthenticated, async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id)
            .populate('book')
            .populate('student');

        if (!issue) {
            req.flash('error', 'Issue record not found.');
            return res.redirect('/circulation/return');
        }

        if (issue.status === 'RETURNED') {
            req.flash('info', 'This book has already been marked as returned.');
            return res.redirect('/circulation/return');
        }

        const ratePerDay = parseInt(process.env.FINE_PER_DAY, 10) || 5;
        const now = new Date();
        const overdueInfo = getOverdueInfo(issue, ratePerDay);

        const { finePaid, returnRemarks } = req.body;

        issue.returnDate = now;
        issue.status = 'RETURNED';
        issue.fineAmount = overdueInfo.fine;
        issue.finePaid = finePaid === 'on' || finePaid === 'true' || overdueInfo.fine === 0;
        issue.returnRemarks = returnRemarks ? returnRemarks.trim() : 'Book returned in good condition';

        await issue.save();

        // Increment book available copies
        if (issue.book) {
            issue.book.availableCopies += 1;
            await issue.book.save();
        }

        // Decrement student current issued count
        if (issue.student) {
            const currentCount = await Issue.countDocuments({
                student: issue.student._id,
                status: { $in: ['ISSUED', 'OVERDUE'] }
            });
            issue.student.currentIssuedCount = currentCount;
            await issue.student.save();
        }

        const fineMsg = overdueInfo.fine > 0 ? ` (Overdue Fine: ₹${overdueInfo.fine} - ${issue.finePaid ? 'Collected' : 'Pending'})` : '';
        req.flash('success', `Book "${issue.book?.title}" returned successfully by ${issue.student?.fullName}!${fineMsg}`);
        res.redirect(`/circulation/slip/${issue._id}`);
    } catch (err) {
        console.error('Error processing return:', err);
        req.flash('error', 'Failed to process return: ' + err.message);
        res.redirect('/circulation/return');
    }
});

// POST Renew Loan (Extend Due Date)
router.post('/renew/:id', isAuthenticated, async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id)
            .populate('book')
            .populate('student');

        if (!issue || issue.status === 'RETURNED') {
            req.flash('error', 'Issue record not found or already returned.');
            return res.redirect('/circulation/return');
        }

        const defaultLoanDays = parseInt(process.env.DEFAULT_LOAN_DAYS, 10) || 14;
        const newDueDate = new Date();
        newDueDate.setDate(newDueDate.getDate() + defaultLoanDays);

        issue.dueDate = newDueDate;
        issue.renewalCount = (issue.renewalCount || 0) + 1;
        issue.status = 'ISSUED';
        issue.fineAmount = 0;
        await issue.save();

        req.flash('success', `Book "${issue.book?.title}" renewed successfully for ${issue.student?.fullName}. New due date: ${newDueDate.toLocaleDateString('en-GB')}.`);
        res.redirect('/circulation/return');
    } catch (err) {
        console.error('Error renewing issue:', err);
        req.flash('error', 'Failed to renew book: ' + err.message);
        res.redirect('/circulation/return');
    }
});

// GET Dedicated Overdue Monitor
router.get('/overdue', isAuthenticated, async (req, res) => {
    try {
        const ratePerDay = parseInt(process.env.FINE_PER_DAY, 10) || 5;
        const now = new Date();

        // Query issues where dueDate < now and returnDate is null
        const overdueIssues = await Issue.find({
            returnDate: null,
            dueDate: { $lt: now }
        })
        .populate('book', 'title isbn callNumber rackNumber author coverColor')
        .populate('student', 'studentId fullName department phone email')
        .sort({ dueDate: 1 });

        let totalOverdueFine = 0;

        const formattedOverdues = overdueIssues.map(issue => {
            const diffTime = Math.abs(now - issue.dueDate);
            const overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const fine = overdueDays * ratePerDay;
            totalOverdueFine += fine;

            // update issue in db to keep consistent
            issue.status = 'OVERDUE';
            issue.fineAmount = fine;
            issue.save();

            return {
                ...issue.toObject(),
                overdueDays,
                fine
            };
        });

        res.render('circulation/overdue', {
            title: 'Overdue Books & Fines Monitor - IMRD Library',
            overdues: formattedOverdues,
            totalOverdueFine,
            ratePerDay
        });
    } catch (err) {
        console.error('Error loading overdue monitor:', err);
        req.flash('error', 'Failed to load overdue records.');
        res.redirect('/dashboard');
    }
});

// POST Settle Fine
router.post('/fine-pay/:id', isAuthenticated, async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);
        if (!issue) {
            req.flash('error', 'Issue record not found.');
            return res.redirect('/circulation/overdue');
        }

        issue.finePaid = true;
        await issue.save();

        req.flash('success', `Fine payment of ₹${issue.fineAmount} marked as collected.`);
        res.redirect('/circulation/overdue');
    } catch (err) {
        req.flash('error', 'Error settling fine: ' + err.message);
        res.redirect('/circulation/overdue');
    }
});

// GET Official Printable Transaction Slip / Receipt
router.get('/slip/:id', isAuthenticated, async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id)
            .populate('book')
            .populate('student');

        if (!issue) {
            req.flash('error', 'Transaction slip not found.');
            return res.redirect('/circulation/return');
        }

        const ratePerDay = parseInt(process.env.FINE_PER_DAY, 10) || 5;
        const overdueInfo = getOverdueInfo(issue, ratePerDay);

        res.render('circulation/slip', {
            title: `Library Slip #${issue._id.toString().slice(-6).toUpperCase()} - IMRD Library`,
            issue,
            overdueInfo,
            ratePerDay
        });
    } catch (err) {
        console.error('Error loading slip:', err);
        req.flash('error', 'Could not generate transaction receipt slip.');
        res.redirect('/circulation/return');
    }
});

module.exports = router;
