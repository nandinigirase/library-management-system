const mongoose = require('express').mongoose || require('mongoose');

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Book title is required'],
        trim: true
    },
    isbn: {
        type: String,
        required: [true, 'ISBN is required'],
        unique: true,
        trim: true
    },
    author: {
        type: String,
        required: [true, 'Author name is required'],
        trim: true
    },
    publisher: {
        type: String,
        trim: true,
        default: 'IMRD Publications / Academic Press'
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: [
            'Computer Applications (MCA/BCA)',
            'Management & Business (MBA/BBA)',
            'Data Science & AI',
            'Software Engineering & Web Tech',
            'Finance & Accounting',
            'Marketing & HR',
            'Mathematics & Statistics',
            'General & Communication',
            'Reference & Research Journals'
        ]
    },
    edition: {
        type: String,
        default: '1st Edition'
    },
    publishYear: {
        type: Number,
        default: 2023
    },
    totalCopies: {
        type: Number,
        required: [true, 'Total copies is required'],
        min: [1, 'Must have at least 1 copy'],
        default: 1
    },
    availableCopies: {
        type: Number,
        required: true,
        min: [0, 'Available copies cannot be negative'],
        default: 1
    },
    rackNumber: {
        type: String,
        required: [true, 'Rack location is required'],
        trim: true,
        default: 'Rack A-01, Shelf 1'
    },
    callNumber: {
        type: String,
        required: [true, 'Call number is required'],
        unique: true,
        trim: true
    },
    price: {
        type: Number,
        default: 450
    },
    coverColor: {
        type: String,
        default: 'linear-gradient(135deg, #1e3a8a, #3b82f6)'
    },
    description: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Compound search index for fast query matching
bookSchema.index({ title: 'text', author: 'text', isbn: 'text', callNumber: 'text' });

module.exports = mongoose.model('Book', bookSchema);
