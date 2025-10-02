<div class="bg-light rounded p-4 my-3">
    <h5 class="mb-3">
        <i class="fas fa-users text-success"></i>
        Referral Management
    </h5>
    
    <div class="row">
        <div class="col-md-12">
            <p>For detailed referral management, use the following SQL queries:</p>
            
            <h6>View all referrals:</h6>
            <pre class="bg-dark text-light p-3 rounded"><code>SELECT 
    r.id,
    ref.name as referrer_name,
    ref.email as referrer_email,
    rfd.name as referred_name,
    rfd.email as referred_email,
    r.status,
    r.created_at
FROM referrals r
JOIN users ref ON r.referrer_id = ref.id
JOIN users rfd ON r.referred_id = rfd.id
ORDER BY r.created_at DESC;</code></pre>

            <h6>Cashback statistics:</h6>
            <pre class="bg-dark text-light p-3 rounded"><code>SELECT 
    u.name,
    u.email,
    u.total_referrals_count,
    u.total_referral_earnings/100 as total_earnings_aed,
    u.referral_balance/100 as current_balance_aed
FROM users u 
WHERE u.total_referrals_count > 0 
ORDER BY u.total_referral_earnings DESC;</code></pre>

            <h6>Cancel referral relationship:</h6>
            <pre class="bg-dark text-light p-3 rounded"><code>UPDATE referrals 
SET status = 'cancelled' 
WHERE id = {referral_id};</code></pre>
        </div>
    </div>
</div>
