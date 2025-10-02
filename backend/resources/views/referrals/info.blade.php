<div class="bg-light rounded p-4 my-3">
    <h5 class="mb-3">
        <i class="fas fa-info-circle text-primary"></i>
        Referral Program Information
    </h5>
    
    <div class="row">
        <div class="col-md-6">
            <h6>How the system works:</h6>
            <ul class="list-unstyled">
                <li>✅ Referral codes are created automatically for all users</li>
                <li>✅ Cashback is credited when referral tops up wallet</li>
                <li>✅ Executors can use bonuses to pay for services</li>
                <li>✅ Statistics are updated in real-time</li>
            </ul>
        </div>
        
        <div class="col-md-6">
            <h6>Default settings:</h6>
            <ul class="list-unstyled">
                <li><strong>Cashback:</strong> 10% of top-up amount</li>
                <li><strong>Minimum:</strong> 1.00 AED for cashback</li>
                <li><strong>Maximum:</strong> 100.00 AED per transaction</li>
                <li><strong>Duration:</strong> 365 days</li>
            </ul>
        </div>
    </div>
    
    <div class="mt-3">
        <h6>API Endpoints:</h6>
        <code>GET /api/referrals/my-stats</code> - user statistics<br>
        <code>GET /api/referrals/my-referrals</code> - referrals list<br>
        <code>POST /api/referrals/use-balance</code> - use bonus balance<br>
        <code>POST /api/referrals/validate-code</code> - validate referral code
    </div>
</div>
