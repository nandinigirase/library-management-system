const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Issue = require('../models/Issue');
const { isAuthenticated } = require('../middleware/auth');

const CATEGORIES = [
    'Computer Applications (MCA/BCA)',
    'Management & Business (MBA/BBA)',
    'Data Science & AI',
    'Software Engineering & Web Tech',
    'Finance & Accounting',
    'Marketing & HR',
    'Mathematics & Statistics',
    'General & Communication',
    'Reference & Research Journals'
];

// Color palette generator for book cover spines
const getCoverPalette = (index) => {
    const gradients = [
        'linear-gradient(135deg, #1e3a8a, #3b82f6)',
        'linear-gradient(135deg, #065f46, #10b981)',
        'linear-gradient(135deg, #7c2d12, #ea580c)',
        'linear-gradient(135deg, #4c1d95, #8b5cf6)',
        'linear-gradient(135deg, #0f766e, #14b8a6)',
        'linear-gradient(135deg, #831843, #ec4899)',
        'linear-gradient(135deg, #1f2937, #4b5563)'
    ];
    return gradients[index % gradients.length];
};

// GET Books list with search and filter
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const { q, category, availability } = req.query;
        const filter = {};

        if (q && q.trim()) {
            const regex = new RegExp(q.trim(), 'i');
            filter.$or = [
                { title: regex },
                { author: regex },
                { isbn: regex },
                { callNumber: regex },
                { publisher: regex }
            ];
        }

        if (category && category !== 'All') {
            filter.category = category;
        }

        if (availability === 'available') {
            filter.availableCopies = { $gt: 0 };
        } else if (availability === 'out') {
            filter.availableCopies = 0;
        }

        const books = await Book.find(filter).sort({ createdAt: -1 });

        res.render('books/index', {
            title: 'Book Catalog - IMRD Library',
            books,
            categories: CATEGORIES,
            selectedCategory: category || 'All',
            selectedAvailability: availability || 'all',
            searchQuery: q || ''
        });
    } catch (err) {
        console.error('Error fetching books:', err);
        req.flash('error', 'Failed to retrieve books.');
        res.redirect('/dashboard');
    }
});

// GET New Book form
router.get('/new', isAuthenticated, (req, res) => {
    // Generate suggested call number
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const suggestedCallNumber = `IMRD-LIB-${randomSuffix}`;

    res.render('books/new', {
        title: 'Add New Book - IMRD Library',
        categories: CATEGORIES,
        suggestedCallNumber
    });
});

// POST Create Book
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const {
            title,
            isbn,
            author,
            publisher,
            category,
            edition,
            publishYear,
            totalCopies,
            rackNumber,
            callNumber,
            price,
            description
        } = req.body;

        const copies = parseInt(totalCopies, 10) || 1;

        // Check if ISBN or Call Number already exists
        const existingBook = await Book.findOne({
            $or: [{ isbn: isbn.trim() }, { callNumber: callNumber.trim() }]
        });

        if (existingBook) {
            req.flash('error', 'A book with this ISBN or Call Number already exists in the catalog.');
            return res.redirect('/books/new');
        }

        const count = await Book.countDocuments();
        const coverColor = getCoverPalette(count);

        const newBook = new Book({
            title: title.trim(),
            isbn: isbn.trim(),
            author: author.trim(),
            publisher: publisher ? publisher.trim() : 'IMRD Academic Press',
            category,
            edition: edition ? edition.trim() : '1st Edition',
            publishYear: parseInt(publishYear, 10) || new Date().getFullYear(),
            totalCopies: copies,
            availableCopies: copies,
            rackNumber: rackNumber ? rackNumber.trim() : 'General Stacks',
            callNumber: callNumber.trim(),
            price: parseFloat(price) || 0,
            coverColor,
            description: description ? description.trim() : ''
        });

        await newBook.save();
        req.flash('success', `Book "${newBook.title}" added successfully to the catalog!`);
        res.redirect('/books');
    } catch (err) {
        console.error('Error adding book:', err);
        req.flash('error', 'Error adding book: ' + err.message);
        res.redirect('/books/new');
    }
});

// GET View Book Details
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            req.flash('error', 'Book not found.');
            return res.redirect('/books');
        }

        // Fetch active borrowing issues and past history
        const activeIssues = await Issue.find({
            book: book._id,
            status: { $in: ['ISSUED', 'OVERDUE'] }
        }).populate('student', 'studentId fullName department phone email');

        const pastIssues = await Issue.find({
            book: book._id,
            status: 'RETURNED'
        }).populate('student', 'studentId fullName department')
          .sort({ returnDate: -1 })
          .limit(10);

        res.render('books/show', {
            title: `${book.title} - Book Details`,
            book,
            activeIssues,
            pastIssues
        });
    } catch (err) {
        console.error('Error loading book details:', err);
        req.flash('error', 'Could not load book information.');
        res.redirect('/books');
    }
});

// GET Edit Book form
router.get('/:id/edit', isAuthenticated, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            req.flash('error', 'Book not found.');
            return res.redirect('/books');
        }

        res.render('books/edit', {
            title: `Edit: ${book.title}`,
            book,
            categories: CATEGORIES
        });
    } catch (err) {
        req.flash('error', 'Could not load book.');
        res.redirect('/books');
    }
});

// POST Update Book
router.post('/:id/edit', isAuthenticated, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            req.flash('error', 'Book not found.');
            return res.redirect('/books');
        }

        const {
            title,
            isbn,
            author,
            publisher,
            category,
            edition,
            publishYear,
            totalCopies,
            rackNumber,
            callNumber,
            price,
            description
        } = req.body;

        const newTotalCopies = parseInt(totalCopies, 10) || book.totalCopies;
        const issuedCopies = book.totalCopies - book.availableCopies;

        if (newTotalCopies < issuedCopies) {
            req.flash('error', `Cannot set total copies to ${newTotalCopies}. Currently ${issuedCopies} copies are actively issued to students.`);
            return res.redirect(`/books/${book._id}/edit`);
        }

        const newAvailableCopies = newTotalCopies - issuedCopies;

        book.title = title.trim();
        book.isbn = isbn.trim();
        book.author = author.trim();
        book.publisher = publisher ? publisher.trim() : book.publisher;
        book.category = category;
        book.edition = edition;
        book.publishYear = parseInt(publishYear, 10) || book.publishYear;
        book.totalCopies = newTotalCopies;
        book.availableCopies = newAvailableCopies;
        book.rackNumber = rackNumber;
        book.callNumber = callNumber.trim();
        book.price = parseFloat(price) || book.price;
        book.description = description;

        await book.save();
        req.flash('success', `Book details for "${book.title}" updated successfully.`);
        res.redirect(`/books/${book._id}`);
    } catch (err) {
        console.error('Error updating book:', err);
        req.flash('error', 'Failed to update book: ' + err.message);
        res.redirect(`/books/${req.params.id}/edit`);
    }
});

// POST Delete Book (Protected against active issues)
router.post('/:id/delete', isAuthenticated, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            req.flash('error', 'Book not found.');
            return res.redirect('/books');
        }

        const activeIssuesCount = await Issue.countDocuments({
            book: book._id,
            status: { $in: ['ISSUED', 'OVERDUE'] }
        });

        if (activeIssuesCount > 0) {
            req.flash('error', `Cannot delete "${book.title}". There are ${activeIssuesCount} copies currently issued to students. Please collect returns first.`);
            return res.redirect(`/books/${book._id}`);
        }

        await Book.findByIdAndDelete(book._id);
        req.flash('success', `Book "${book.title}" has been deleted from catalog.`);
        res.redirect('/books');
    } catch (err) {
        console.error('Error deleting book:', err);
        req.flash('error', 'Failed to delete book: ' + err.message);
        res.redirect('/books');
    }
});

module.exports = router;
