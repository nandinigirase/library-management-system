/**
 * IMRD Shahada - Dashboard Analytics Charts
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Book Categories Distribution Donut Chart
    const catCanvas = document.getElementById('categoryDoughnutChart');
    if (catCanvas && window.categoryChartData) {
        const labels = window.categoryChartData.map(c => c._id);
        const data = window.categoryChartData.map(c => c.count);

        new Chart(catCanvas, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#1e3a8a',
                        '#d97706',
                        '#059669',
                        '#7c3aed',
                        '#0f766e',
                        '#dc2626',
                        '#475569',
                        '#ea580c',
                        '#2563eb'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 12,
                            font: {
                                family: "'Plus Jakarta Sans', sans-serif",
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` ${context.label}: ${context.raw} Copies`;
                            }
                        }
                    }
                },
                cutout: '68%'
            }
        });
    }

    // 2. Department Wise Student Borrowing Bar Chart
    const deptCanvas = document.getElementById('deptBarChart');
    if (deptCanvas && window.deptChartData) {
        const labels = window.deptChartData.map(d => d._id);
        const registered = window.deptChartData.map(d => d.count);
        const borrowed = window.deptChartData.map(d => d.issued);

        new Chart(deptCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Registered Students',
                        data: registered,
                        backgroundColor: '#1b263b',
                        borderRadius: 6
                    },
                    {
                        label: 'Active Borrowed Books',
                        data: borrowed,
                        backgroundColor: '#f59e0b',
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            boxWidth: 14,
                            font: {
                                family: "'Plus Jakarta Sans', sans-serif",
                                size: 12
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0,
                            font: { family: "'Plus Jakarta Sans', sans-serif" }
                        },
                        grid: {
                            color: '#f1f5f9'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: { family: "'Plus Jakarta Sans', sans-serif", weight: '600' }
                        }
                    }
                }
            }
        });
    }
});
