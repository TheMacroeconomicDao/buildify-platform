<div class="row">
    <div class="col-lg-6">
        <div class="card">
            <div class="card-header">
                <h5 class="card-title">Order Status Statistics</h5>
            </div>
            <div class="card-body">
                <canvas id="ordersStatusChart"></canvas>
            </div>
        </div>
    </div>
    
    <div class="col-lg-6">
        <div class="card">
            <div class="card-header">
                <h5 class="card-title">Complaint Reasons Statistics</h5>
            </div>
            <div class="card-body">
                <canvas id="complaintsReasonChart"></canvas>
            </div>
        </div>
    </div>
</div>

<div class="row mt-4">
    <div class="col-12">
        <div class="card">
            <div class="card-header">
                <h5 class="card-title">Activity for the Last 30 Days</h5>
            </div>
            <div class="card-body">
                <canvas id="dailyActivityChart"></canvas>
            </div>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
    // График статусов заказов
    const ordersStatusData = @json($orders_by_status ?? []);
    if (document.getElementById('ordersStatusChart') && Object.keys(ordersStatusData).length > 0) {
        new Chart(document.getElementById('ordersStatusChart'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(ordersStatusData),
                datasets: [{
                    data: Object.values(ordersStatusData),
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // График причин жалоб
    const complaintsReasonData = @json($complaints_by_reason ?? []);
    if (document.getElementById('complaintsReasonChart') && Object.keys(complaintsReasonData).length > 0) {
        new Chart(document.getElementById('complaintsReasonChart'), {
            type: 'pie',
            data: {
                labels: Object.keys(complaintsReasonData),
                datasets: [{
                    data: Object.values(complaintsReasonData),
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40',
                        '#FF6384'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // График активности за 30 дней
    const dailyStatsData = @json($daily_stats ?? []);
    if (document.getElementById('dailyActivityChart') && dailyStatsData.length > 0) {
        new Chart(document.getElementById('dailyActivityChart'), {
            type: 'line',
            data: {
                labels: dailyStatsData.map(item => item.date),
                datasets: [
                    {
                        label: 'New Users',
                        data: dailyStatsData.map(item => item.users),
                        borderColor: '#36A2EB',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'New Orders',
                        data: dailyStatsData.map(item => item.orders),
                        borderColor: '#4BC0C0',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Complaints',
                        data: dailyStatsData.map(item => item.complaints),
                        borderColor: '#FF6384',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }
});
</script>
