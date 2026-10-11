const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: [true, 'Student ID / Roll No is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    fullName: {
        type: String,
        required: [true, 'Student full name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email address is required'],
        unique: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: [true, 'Contact phone number is required'],
        trim: true
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        enum: ['MCA', 'MBA', 'BCA', 'BBA', 'B.Voc (Software Development)', 'MMS', 'Integrated MCA']
    },
    academicYear: {
        type: String,
        required: [true, 'Academic year is required'],
        enum: ['FY (First Year)', 'SY (Second Year)', 'TY (Third Year)', 'Final Year']
    },
    maxAllowedBooks: {
        type: Number,
        default: 3,
        min: 1
    },
    currentIssuedCount: {
        type: Number,
        default: 0,
        min: 0
    },
    status: {
        type: String,
        enum: ['Active', 'Suspended'],
        default: 'Active'
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        default: 'Male'
    },
    address: {
        type: String,
        trim: true,
        default: 'Shahada'
    }
}, {
    timestamps: true
});

studentSchema.index({ studentId: 'text', fullName: 'text', email: 'text', phone: 'text' });

module.exports = mongoose.model('Student', studentSchema);
