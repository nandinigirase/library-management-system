const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Book = require('../models/Book');
const Student = require('../models/Student');
const Issue = require('../models/Issue');

const seedDatabase = async () => {
    try {
        // 1. Check & Seed Admin
        const adminCount = await Admin.countDocuments();
        if (adminCount === 0) {
            const defaultAdmin = new Admin({
                username: 'admin',
                password: 'admin123', // Will be hashed by Admin pre('save') hook
                fullName: 'Dr. Manoj B. Patel',
                email: 'librarian@imrdshahada.ac.in',
                role: 'Chief Librarian',
                staffId: 'IMRD-LIB-001',
                phone: '+91 94227 88123'
            });
            await defaultAdmin.save();
            console.log('👤 Default Admin Created: admin / admin123');
        }

        // 2. Check & Seed Books
        const bookCount = await Book.countDocuments();
        let books = [];
        if (bookCount === 0) {
            const sampleBooks = [
                {
                    title: 'Database System Concepts (8th Edition)',
                    isbn: '978-0078022159',
                    author: 'Abraham Silberschatz, Henry F. Korth',
                    publisher: 'McGraw-Hill Education',
                    category: 'Computer Applications (MCA/BCA)',
                    edition: '8th Global Edition',
                    publishYear: 2022,
                    totalCopies: 8,
                    availableCopies: 6,
                    rackNumber: 'Rack CS-01, Shelf A',
                    callNumber: 'IMRD-CS-001',
                    price: 850,
                    coverColor: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
                    description: 'Comprehensive textbook covering database engine internals, SQL, relational calculus, query optimization, and NoSQL systems.'
                },
                {
                    title: 'Principles of Marketing',
                    isbn: '978-0134492513',
                    author: 'Philip Kotler, Gary Armstrong',
                    publisher: 'Pearson Education India',
                    category: 'Management & Business (MBA/BBA)',
                    edition: '17th Edition',
                    publishYear: 2021,
                    totalCopies: 10,
                    availableCopies: 8,
                    rackNumber: 'Rack MGMT-02, Shelf C',
                    callNumber: 'IMRD-MBA-014',
                    price: 720,
                    coverColor: 'linear-gradient(135deg, #b45309, #f59e0b)',
                    description: 'Foundational framework of modern marketing, customer engagement, digital channels, and consumer psychology.'
                },
                {
                    title: 'Node.js Design Patterns & Express Architecture',
                    isbn: '978-1839214110',
                    author: 'Mario Casciaro, Luciano Mammino',
                    publisher: 'Packt Publishing',
                    category: 'Software Engineering & Web Tech',
                    edition: '3rd Edition',
                    publishYear: 2023,
                    totalCopies: 6,
                    availableCopies: 4,
                    rackNumber: 'Rack CS-03, Shelf B',
                    callNumber: 'IMRD-CS-088',
                    price: 990,
                    coverColor: 'linear-gradient(135deg, #065f46, #10b981)',
                    description: 'Master server-side JavaScript, asynchronous control flow, microservices, and enterprise web application architecture.'
                },
                {
                    title: 'Financial Management: Theory and Practice',
                    isbn: '978-9389588231',
                    author: 'I. M. Pandey',
                    publisher: 'Vikas Publishing House',
                    category: 'Finance & Accounting',
                    edition: '12th Edition',
                    publishYear: 2022,
                    totalCopies: 7,
                    availableCopies: 5,
                    rackNumber: 'Rack FIN-01, Shelf A',
                    callNumber: 'IMRD-FIN-005',
                    price: 680,
                    coverColor: 'linear-gradient(135deg, #4c1d95, #8b5cf6)',
                    description: 'Essential textbook for MBA finance, corporate valuation, capital budgeting, working capital, and dividend policy.'
                },
                {
                    title: 'Python Machine Learning & Deep Learning',
                    isbn: '978-1789955750',
                    author: 'Sebastian Raschka, Vahid Mirjalili',
                    publisher: 'Packt Publishing',
                    category: 'Data Science & AI',
                    edition: '3rd Edition',
                    publishYear: 2023,
                    totalCopies: 5,
                    availableCopies: 3,
                    rackNumber: 'Rack AI-01, Shelf D',
                    callNumber: 'IMRD-AI-019',
                    price: 1100,
                    coverColor: 'linear-gradient(135deg, #0f766e, #14b8a6)',
                    description: 'Practical predictive modeling using Scikit-Learn, PyTorch, Convolutional Neural Networks, and transformers.'
                },
                {
                    title: 'Data Structures and Algorithms in Java',
                    isbn: '978-1118771334',
                    author: 'Michael T. Goodrich, Roberto Tamassia',
                    publisher: 'Wiley India',
                    category: 'Computer Applications (MCA/BCA)',
                    edition: '6th Edition',
                    publishYear: 2020,
                    totalCopies: 9,
                    availableCopies: 8,
                    rackNumber: 'Rack CS-02, Shelf A',
                    callNumber: 'IMRD-CS-042',
                    price: 795,
                    coverColor: 'linear-gradient(135deg, #1e40af, #60a5fa)',
                    description: 'Rigorous algorithmic complexity analysis, tree structures, graph algorithms, hash maps, and dynamic programming.'
                },
                {
                    title: 'Human Resource Management: Text and Cases',
                    isbn: '978-9352605484',
                    author: 'K. Aswathappa',
                    publisher: 'McGraw-Hill Education',
                    category: 'Marketing & HR',
                    edition: '9th Edition',
                    publishYear: 2021,
                    totalCopies: 6,
                    availableCopies: 5,
                    rackNumber: 'Rack HR-02, Shelf B',
                    callNumber: 'IMRD-HR-007',
                    price: 640,
                    coverColor: 'linear-gradient(135deg, #991b1b, #ef4444)',
                    description: 'Comprehensive coverage of recruitment, talent management, industrial relations, labor laws, and corporate culture.'
                },
                {
                    title: 'Research Methodology: Methods and Techniques',
                    isbn: '978-9386649225',
                    author: 'C. R. Kothari, Gaurav Garg',
                    publisher: 'New Age International',
                    category: 'Reference & Research Journals',
                    edition: '4th Edition',
                    publishYear: 2022,
                    totalCopies: 5,
                    availableCopies: 4,
                    rackNumber: 'Rack REF-01, Shelf C',
                    callNumber: 'IMRD-REF-003',
                    price: 495,
                    coverColor: 'linear-gradient(135deg, #374151, #6b7280)',
                    description: 'Hypothesis testing, statistical sampling techniques, research proposal drafting, and quantitative data analysis.'
                }
            ];

            books = await Book.insertMany(sampleBooks);
            console.log(`📚 Seeded ${books.length} Books for IMRD Library`);
        } else {
            books = await Book.find();
        }

        // 3. Check & Seed Students
        const studentCount = await Student.countDocuments();
        let students = [];
        if (studentCount === 0) {
            const sampleStudents = [
                {
                    studentId: 'IMRD/MCA/2024/001',
                    fullName: 'Rohit Ramesh Patil',
                    email: 'rohit.patil@imrdshahada.ac.in',
                    phone: '+91 98231 11223',
                    department: 'MCA',
                    academicYear: 'SY (Second Year)',
                    maxAllowedBooks: 3,
                    currentIssuedCount: 2,
                    status: 'Active',
                    gender: 'Male',
                    address: 'Vidya Vihar Colony, Shahada'
                },
                {
                    studentId: 'IMRD/MCA/2024/015',
                    fullName: 'Pooja Sanjay Chaudhari',
                    email: 'pooja.chaudhari@imrdshahada.ac.in',
                    phone: '+91 94215 33445',
                    department: 'MCA',
                    academicYear: 'FY (First Year)',
                    maxAllowedBooks: 3,
                    currentIssuedCount: 1,
                    status: 'Active',
                    gender: 'Female',
                    address: 'Dongargaon Road, Shahada'
                },
                {
                    studentId: 'IMRD/MBA/2024/008',
                    fullName: 'Aditya Pravin Shinde',
                    email: 'aditya.shinde@imrdshahada.ac.in',
                    phone: '+91 97654 55667',
                    department: 'MBA',
                    academicYear: 'SY (Second Year)',
                    maxAllowedBooks: 3,
                    currentIssuedCount: 1,
                    status: 'Active',
                    gender: 'Male',
                    address: 'Shivaji Chowk, Shahada'
                },
                {
                    studentId: 'IMRD/BCA/2024/032',
                    fullName: 'Neha Dinesh Sharma',
                    email: 'neha.sharma@imrdshahada.ac.in',
                    phone: '+91 98901 77889',
                    department: 'BCA',
                    academicYear: 'TY (Third Year)',
                    maxAllowedBooks: 3,
                    currentIssuedCount: 1,
                    status: 'Active',
                    gender: 'Female',
                    address: 'Khetiya Road, Shahada'
                },
                {
                    studentId: 'IMRD/BBA/2024/019',
                    fullName: 'Gaurav Sunil Marathe',
                    email: 'gaurav.marathe@imrdshahada.ac.in',
                    phone: '+91 98502 99001',
                    department: 'BBA',
                    academicYear: 'SY (Second Year)',
                    maxAllowedBooks: 3,
                    currentIssuedCount: 0,
                    status: 'Active',
                    gender: 'Male',
                    address: 'Subhash Nagar, Shahada'
                }
            ];

            students = await Student.insertMany(sampleStudents);
            console.log(`🎓 Seeded ${students.length} Students for IMRD Shahada`);
        } else {
            students = await Student.find();
        }

        // 4. Check & Seed Circulation Issues (Issued, Overdue, Returned)
        const issueCount = await Issue.countDocuments();
        if (issueCount === 0 && books.length >= 4 && students.length >= 4) {
            const today = new Date();
            
            // Overdue issue (issued 24 days ago, due 10 days ago)
            const pastIssueDate1 = new Date(today);
            pastIssueDate1.setDate(today.getDate() - 24);
            const pastDueDate1 = new Date(today);
            pastDueDate1.setDate(today.getDate() - 10);

            // Active regular issue (issued 4 days ago, due in 10 days)
            const activeIssueDate2 = new Date(today);
            activeIssueDate2.setDate(today.getDate() - 4);
            const activeDueDate2 = new Date(today);
            activeDueDate2.setDate(today.getDate() + 10);

            // Active regular issue (issued 2 days ago, due in 12 days)
            const activeIssueDate3 = new Date(today);
            activeIssueDate3.setDate(today.getDate() - 2);
            const activeDueDate3 = new Date(today);
            activeDueDate3.setDate(today.getDate() + 12);

            // Returned book with slight overdue fine settled
            const returnedIssueDate = new Date(today);
            returnedIssueDate.setDate(today.getDate() - 30);
            const returnedDueDate = new Date(today);
            returnedDueDate.setDate(today.getDate() - 16);
            const returnActualDate = new Date(today);
            returnActualDate.setDate(today.getDate() - 14); // 2 days overdue = ₹10 fine

            const sampleIssues = [
                {
                    book: books[0]._id, // Database System Concepts
                    student: students[0]._id, // Rohit Patil
                    issueDate: pastIssueDate1,
                    dueDate: pastDueDate1,
                    returnDate: null,
                    status: 'OVERDUE',
                    fineAmount: 50, // 10 days * ₹5
                    finePaid: false,
                    remarks: 'Semester project reference',
                    issuedBy: 'Dr. Manoj B. Patel'
                },
                {
                    book: books[1]._id, // Principles of Marketing
                    student: students[2]._id, // Aditya Shinde
                    issueDate: pastIssueDate1,
                    dueDate: pastDueDate1,
                    returnDate: null,
                    status: 'OVERDUE',
                    fineAmount: 50,
                    finePaid: false,
                    remarks: 'Marketing management seminar preparation',
                    issuedBy: 'Dr. Manoj B. Patel'
                },
                {
                    book: books[2]._id, // Node.js Design Patterns
                    student: students[0]._id, // Rohit Patil
                    issueDate: activeIssueDate2,
                    dueDate: activeDueDate2,
                    returnDate: null,
                    status: 'ISSUED',
                    fineAmount: 0,
                    finePaid: false,
                    remarks: 'Web development lab work',
                    issuedBy: 'Dr. Manoj B. Patel'
                },
                {
                    book: books[3]._id, // Financial Management
                    student: students[1]._id, // Pooja Chaudhari
                    issueDate: activeIssueDate3,
                    dueDate: activeDueDate3,
                    returnDate: null,
                    status: 'ISSUED',
                    fineAmount: 0,
                    finePaid: false,
                    remarks: 'Course reading',
                    issuedBy: 'Dr. Manoj B. Patel'
                },
                {
                    book: books[4]._id, // Python Machine Learning
                    student: students[3]._id, // Neha Sharma
                    issueDate: returnedIssueDate,
                    dueDate: returnedDueDate,
                    returnDate: returnActualDate,
                    status: 'RETURNED',
                    fineAmount: 10,
                    finePaid: true,
                    remarks: 'Returned in good condition. Late fee collected.',
                    returnRemarks: 'Verified book integrity. Barcode scanned.',
                    issuedBy: 'Dr. Manoj B. Patel'
                }
            ];

            await Issue.insertMany(sampleIssues);
            console.log('🔄 Seeded Sample Circulation Issues & Overdue Records');
        }
    } catch (err) {
        console.error('Error seeding database:', err.message);
    }
};

module.exports = seedDatabase;
