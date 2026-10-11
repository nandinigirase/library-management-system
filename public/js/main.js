/**
 * IMRD Shahada - Library Management System
 * Client-Side Core UI Functionality & Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Live Digital Clock in Topbar
    const clockEl = document.getElementById('digital-clock-time');
    if (clockEl) {
        const updateClock = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });
            const dateString = now.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
            clockEl.textContent = `${dateString} • ${timeString}`;
        };
        updateClock();
        setInterval(updateClock, 1000);
    }

    // 2. Mobile Sidebar Toggle
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    const sidebar = document.getElementById('app-sidebar');
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('show');
        });

        // Close sidebar if clicked outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth < 992 && sidebar.classList.contains('show')) {
                if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
                    sidebar.classList.remove('show');
                }
            }
        });
    }

    // 3. Auto-Dismiss Flash Alerts
    const alerts = document.querySelectorAll('.alert-dismissible');
    alerts.forEach((alert) => {
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 400);
        }, 5500);
    });

    // 4. Quick Table Live Filter (for instant client search)
    const tableSearchInput = document.getElementById('table-quick-search');
    if (tableSearchInput) {
        tableSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const rows = document.querySelectorAll('.filterable-table tbody tr');
            rows.forEach((row) => {
                const text = row.textContent.toLowerCase();
                if (text.includes(query)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }

    // 5. Circulation Return Fine Calculator Preview
    const returnModal = document.getElementById('returnActionModal');
    if (returnModal) {
        returnModal.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            if (!button) return;

            const issueId = button.getAttribute('data-issue-id');
            const bookTitle = button.getAttribute('data-book-title');
            const studentName = button.getAttribute('data-student-name');
            const overdueDays = parseInt(button.getAttribute('data-overdue-days'), 10) || 0;
            const fineAmount = parseFloat(button.getAttribute('data-fine-amount')) || 0;

            const modalForm = returnModal.querySelector('#returnForm');
            modalForm.action = `/circulation/return/${issueId}`;

            returnModal.querySelector('#modalBookTitle').textContent = bookTitle;
            returnModal.querySelector('#modalStudentName').textContent = studentName;
            returnModal.querySelector('#modalOverdueDays').textContent = overdueDays > 0 ? `${overdueDays} Day(s) Overdue` : 'On Time';
            returnModal.querySelector('#modalFineAmount').textContent = `₹${fineAmount}`;

            const finePaidCheckbox = returnModal.querySelector('#finePaidCheckbox');
            const fineNoticeBox = returnModal.querySelector('#fineNoticeBox');

            if (fineAmount > 0) {
                fineNoticeBox.classList.remove('d-none');
                finePaidCheckbox.checked = true;
            } else {
                fineNoticeBox.classList.add('d-none');
                finePaidCheckbox.checked = true;
            }
        });
    }

    // 6. Delete Confirmation Safeguard
    const deleteForms = document.querySelectorAll('.confirm-delete-form');
    deleteForms.forEach(form => {
        form.addEventListener('submit', (e) => {
            const confirmMsg = form.getAttribute('data-confirm-message') || 'Are you sure you want to delete this record? This action cannot be undone.';
            if (!confirm(confirmMsg)) {
                e.preventDefault();
            }
        });
    });
});
