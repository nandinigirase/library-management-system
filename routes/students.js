const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Issue = require('../models/Issue');
const { isAuthenticated } = require('../middleware/auth');

const DEPARTMENTS = [
    'MCA',
    'MBA',
    'BCA',
    'BBA',
    'B.Voc (Software Development)',
    'MMS',
    'Integrated MCA'
];

const ACADEMIC_YEARS = [
    'FY (First Year)',
    'SY (Second Year)',
    'TY (Third Year)',
    'Final Year'
];

// GET Students List with search & filter
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const { q, department, status } = req.query;
        const filter = {};

        if (q && q.trim()) {
            const regex = new RegExp(q.trim(), 'i');
            filter.$or = [
                { studentId: regex },
                { fullName: regex },
                { email: regex },
                { phone: regex }
            ];
        }

        if (department && department !== 'All') {
            filter.department = department;
        }

        if (status && status !== 'All') {
            filter.status = status;
        }

        const students = await Student.find(filter).sort({ studentId: 1 });

        res.render('students/index', {
            title: 'Student Library Members - IMRD Shahada',
            students,
            departments: DEPARTMENTS,
            selectedDepartment: department || 'All',
            selectedStatus: status || 'All',
            searchQuery: q || ''
        });
    } catch (err) {
        console.error('Error fetching students:', err);
        req.flash('error', 'Failed to retrieve student records.');
        res.redirect('/dashboard');
    }
});

// GET New Student Form
router.get('/new', isAuthenticated, (req, res) => {
    res.render('students/new', {
        title: 'Register Student Member - IMRD Library',
        departments: DEPARTMENTS,
        academicYears: ACADEMIC_YEARS
    });
});

// POST Create Student
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const {
            studentId,
            fullName,
            email,
            phone,
            department,
            academicYear,
            maxAllowedBooks,
            gender,
            address
        } = req.body;

        const cleanId = studentId.trim().toUpperCase();

        // Check duplicate ID or email
        const existing = await Student.findOne({
            $or: [{ studentId: cleanId }, { email: email.trim().toLowerCase() }]
        });

        if (existing) {
            req.flash('error', 'A student with this Student ID or Email already exists.');
            return res.redirect('/students/new');
        }

        const newStudent = new Student({
            studentId: cleanId,
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            department,
            academicYear,
            maxAllowedBooks: parseInt(maxAllowedBooks, 10) || 3,
            gender: gender || 'Male',
            address: address ? address.trim() : 'Shahada'
        });

        await newStudent.save();
        req.flash('success', `Student member "${newStudent.fullName}" (${newStudent.studentId}) registered successfully!`);
        res.redirect(`/students/${newStudent._id}`);
    } catch (err) {
        console.error('Error creating student:', err);
        req.flash('error', 'Error registering student: ' + err.message);
        res.redirect('/students/new');
    }
});

// GET View Student Profile & Library Card
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            req.flash('error', 'Student record not found.');
            return res.redirect('/students');
        }

        // Active borrowed books
        const activeIssues = await Issue.find({
            student: student._id,
            status: { $in: ['ISSUED', 'OVERDUE'] }
        }).populate('book', 'title isbn callNumber rackNumber coverColor');

        // Past returned books
        const pastIssues = await Issue.find({
            student: student._id,
            status: 'RETURNED'
        }).populate('book', 'title isbn callNumber')
          .sort({ returnDate: -1 });

        // Update student's currentIssuedCount to keep in sync
        student.currentIssuedCount = activeIssues.length;
        await student.save();

        res.render('students/show', {
            title: `${student.fullName} - Library Member Profile`,
            student,
            activeIssues,
            pastIssues
        });
    } catch (err) {
        console.error('Error loading student profile:', err);
        req.flash('error', 'Could not load student information.');
        res.redirect('/students');
    }
});

// GET Edit Student Form
router.get('/:id/edit', isAuthenticated, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            req.flash('error', 'Student not found.');
            return res.redirect('/students');
        }

        res.render('students/edit', {
            title: `Edit: ${student.fullName}`,
            student,
            departments: DEPARTMENTS,
            academicYears: ACADEMIC_YEARS
        });
    } catch (err) {
        req.flash('error', 'Could not load student.');
        res.redirect('/students');
    }
});

// POST Update Student
router.post('/:id/edit', isAuthenticated, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            req.flash('error', 'Student not found.');
            return res.redirect('/students');
        }

        const {
            fullName,
            email,
            phone,
            department,
            academicYear,
            maxAllowedBooks,
            status,
            gender,
            address
        } = req.body;

        student.fullName = fullName.trim();
        student.email = email.trim().toLowerCase();
        student.phone = phone.trim();
        student.department = department;
        student.academicYear = academicYear;
        student.maxAllowedBooks = parseInt(maxAllowedBooks, 10) || 3;
        student.status = status;
        student.gender = gender;
        student.address = address;

        await student.save();
        req.flash('success', `Student profile for "${student.fullName}" updated successfully.`);
        res.redirect(`/students/${student._id}`);
    } catch (err) {
        console.error('Error updating student:', err);
        req.flash('error', 'Failed to update student: ' + err.message);
        res.redirect(`/students/${req.params.id}/edit`);
    }
});

// POST Delete Student
router.post('/:id/delete', isAuthenticated, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            req.flash('error', 'Student not found.');
            return res.redirect('/students');
        }

        const activeIssuesCount = await Issue.countDocuments({
            student: student._id,
            status: { $in: ['ISSUED', 'OVERDUE'] }
        });

        if (activeIssuesCount > 0) {
            req.flash('error', `Cannot delete student "${student.fullName}". They currently hold ${activeIssuesCount} unreturned book(s). Please return all books before deleting.`);
            return res.redirect(`/students/${student._id}`);
        }

        await Student.findByIdAndDelete(student._id);
        req.flash('success', `Student member "${student.fullName}" removed successfully.`);
        res.redirect('/students');
    } catch (err) {
        console.error('Error deleting student:', err);
        req.flash('error', 'Failed to delete student: ' + err.message);
        res.redirect('/students');
    }
});

module.exports = router;
