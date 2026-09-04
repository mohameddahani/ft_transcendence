-- D1 verification: every member's plan, expiry and days remaining.
-- Prototype for the `list_expiring_memberships` tool (task 2.1).
--
-- The point of this query: `days_remaining` and `derived_status` come from
-- expires_at vs now(). `stored_status` is shown ONLY to prove the two can drift.
-- Guardrail 6: the AI layer never trusts membership_status, because it is kept
-- current by a cron job and a missed run corrupts every answer silently.

SELECT
    m.first_name || ' ' || m.last_name              AS member,
    mp.plan_name,
    ms.expires_at::date                             AS expires_on,
    (ms.expires_at::date - CURRENT_DATE)            AS days_remaining,
    CASE
        WHEN ms.expires_at <  NOW()                        THEN 'expired'
        WHEN ms.expires_at <  NOW() + INTERVAL '7 days'    THEN 'expiring_soon'
        ELSE                                                    'active'
    END                                             AS derived_status,
    ms.membership_status                            AS stored_status,
    p.payment_status,
    p.amount
FROM memberships ms
JOIN members          m  ON m.id  = ms.member_id
JOIN membership_plans mp ON mp.id = ms.membership_plan_id
LEFT JOIN payments    p  ON p.member_id = ms.member_id
-- Tenant scope. In the service this filter is injected by db/scope.py and is
-- never written by hand at a call site.
WHERE ms.admin_id = (SELECT id FROM users WHERE user_name = 'karim_admin')
ORDER BY days_remaining;
