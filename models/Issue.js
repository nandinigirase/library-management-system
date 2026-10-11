const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: [true, 'Book reference is required']
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: [true, 'Student reference is required']
    },
    issueDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    returnDate: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['ISSUED', 'RETURNED', 'OVERDUE'],
        default: 'ISSUED'
    },
    fineAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    finePaid: {
        type: Boolean,
        default: false
    },
    renewalCount: {
        type: Number,
        default: 0
    },
    remarks: {
        type: String,
        trim: true,
        default: 'Standard library loan'
    },
    returnRemarks: {
        type: String,
        trim: true
    },
    issuedBy: {
        type: String,
        default: 'Chief Librarian'
    }
}, {
    timestamps: true
});

// Calculate overdue days and fine amount
issueSchema.methods.calculateOverdueAndFine = function (ratePerDay = 5) {
    if (this.status === 'RETURNED' && this.returnDate) {
        // Already returned: fine was computed on returnDate
        if (this.returnDate > this.dueDate) {
            const diffTime = Math.abs(this.returnDate - this.dueDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return { overdueDays: diffDays, fine: diffDays * ratePerDay };
        }
        return { overdueDays: 0, fine: 0 };
    }

    // Active issue: check against current date
    const now = new Date();
    if (now > this.dueDate) {
        const diffTime = Math.abs(now - this.dueDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { overdueDays: diffDays, fine: diffDays * ratePerDay };
    }

    return { overdueDays: 0, fine: 0 };
};

issueSchema.index({ book: 1, student: 1, status: 1 });

module.exports = mongoose.model('Issue', issueSchema);
