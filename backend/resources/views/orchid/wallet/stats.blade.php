<div class="row">
    <div class="col-md-4">
        <div class="card">
            <div class="card-body text-center">
                <h3 class="text-success">{{ number_format($total_balance_aed, 2) }} AED</h3>
                <p class="text-muted">Total Balance in System</p>
            </div>
        </div>
    </div>
    <div class="col-md-4">
        <div class="card">
            <div class="card-body text-center">
                <h3 class="text-primary">{{ $users_with_balance }}</h3>
                <p class="text-muted">Users with Balance</p>
            </div>
        </div>
    </div>
    <div class="col-md-4">
        <div class="card">
            <div class="card-body text-center">
                <h3 class="text-info">{{ number_format($average_balance_aed, 2) }} AED</h3>
                <p class="text-muted">Average Balance</p>
            </div>
        </div>
    </div>
</div>
