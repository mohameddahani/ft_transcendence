-- Atlas Fitness Agadir and three members: active, expiring in 5 days, expired and unpaid.
-- Empties the database first (TRUNCATE), so run it before oasis_gym.sql and the seeder.

TRUNCATE users, plans CASCADE;

WITH
platform_plan AS (
    INSERT INTO plans (id, plan_name, description, max_members, is_active, created_at, updated_at)
    VALUES (gen_random_uuid()::text, 'SaaS Base Tier', 'Standard platform tier', 500, true, NOW(), NOW())
    RETURNING id
),
platform_duration AS (
    INSERT INTO plan_durations (id, plan_id, duration_days, price, created_at, updated_at)
    SELECT gen_random_uuid()::text, id, 365, 12000.00, NOW(), NOW()
    FROM platform_plan
    RETURNING id, price
),

-- this user's id is the admin_id of every gym table
admin_user AS (
    INSERT INTO users (
        id, first_name, last_name, company_name, email, user_name, password,
        phone_number, gender, birth_date, role, account_status,
        is_account_verified, terms_accepted, profile_image_url, created_at, updated_at
    )
    VALUES (
        gen_random_uuid()::text, 'Karim', 'Bennani', 'Atlas Fitness Agadir',
        'karim@atlasfitness.ma', 'karim_admin', 'hashed_password_123',
        '+212600000001', 'MALE'::"Gender", '1988-04-15'::timestamp,
        'ADMIN'::"Role", 'ACTIVE'::"UserAccountStatus", true, true,
        'default-image.jpg', NOW(), NOW()
    )
    RETURNING id
),
platform_subscription AS (
    INSERT INTO subscriptions (
        id, user_id, plan_id, plan_duration_id, amount,
        subscription_status, started_at, expires_at, created_at, updated_at
    )
    SELECT gen_random_uuid()::text, u.id, p.id, pd.id, pd.price,
           'ACTIVE'::"SubscriptionStatus", NOW(), NOW() + INTERVAL '1 year', NOW(), NOW()
    FROM admin_user u, platform_plan p, platform_duration pd
    RETURNING id
),

gym_plan AS (
    INSERT INTO membership_plans (id, admin_id, plan_name, description, weekly_visit_limit, is_active, created_at, updated_at)
    SELECT gen_random_uuid()::text, id, 'Basic Monthly', 'Standard gym access', 4, true, NOW(), NOW()
    FROM admin_user
    RETURNING id, admin_id
),
gym_plan_duration AS (
    INSERT INTO membership_plan_durations (id, membership_plan_id, duration_days, price, created_at, updated_at)
    SELECT gen_random_uuid()::text, id, 30, 300.00, NOW(), NOW()
    FROM gym_plan
    RETURNING id, membership_plan_id, duration_days, price
),

member_spec (first_name, last_name, email, user_name, phone_number,
             address, emergency_contact, gender, birth_date, days_to_expiry, paid) AS (
    VALUES
        ('Youssef','Alami',  'youssef@gmail.com','youssef_a','+212611111111',
         'Agadir','+212699999991','MALE'  ,DATE '1995-05-12',  20, true ),
        ('Siham',  'Idrissi','siham@gmail.com',  'siham_i',  '+212622222222',
         'Agadir','+212699999992','FEMALE',DATE '1998-11-23',   5, true ),
        ('Omar',   'Tazi',   'omar@gmail.com',   'omar_t',   '+212633333333',
         'Agadir','+212699999993','MALE'  ,DATE '1990-02-01', -30, false)
),
member_rows AS (
    INSERT INTO members (
        id, admin_id, first_name, last_name, email, user_name, phone_number,
        address, emergency_contact, gender, birth_date, account_status, role,
        profile_image_url, created_at, updated_at
    )
    SELECT gen_random_uuid()::text, a.id, s.first_name, s.last_name, s.email, s.user_name,
           s.phone_number, s.address, s.emergency_contact,
           s.gender::"Gender", s.birth_date::timestamp,
           'ACTIVE'::"MemberAccountStatus", 'MEMBER'::"Role",
           'default-member-image.jpg',
           NOW() + make_interval(days => s.days_to_expiry)
                 - make_interval(days => gpd.duration_days),
           NOW()
    FROM member_spec s CROSS JOIN admin_user a CROSS JOIN gym_plan_duration gpd
    RETURNING id, admin_id, user_name
),

membership_rows AS (
    INSERT INTO memberships (
        id, admin_id, member_id, membership_plan_id, membership_plan_duration_id,
        membership_status, start_date, expires_at, created_at, updated_at
    )
    SELECT gen_random_uuid()::text, m.admin_id, m.id, gp.id, gpd.id,
           CASE WHEN s.days_to_expiry >= 0 THEN 'ACTIVE' ELSE 'EXPIRED' END::"MembershipStatus",
           NOW() + make_interval(days => s.days_to_expiry) - make_interval(days => gpd.duration_days),
           NOW() + make_interval(days => s.days_to_expiry),
           NOW(), NOW()
    FROM member_rows m
    JOIN member_spec s ON s.user_name = m.user_name
    CROSS JOIN gym_plan gp
    CROSS JOIN gym_plan_duration gpd
    RETURNING id, admin_id, member_id, start_date
),

payment_rows AS (
    INSERT INTO payments (
        id, admin_id, member_id, amount, paid_at, due_date, payment_status, created_at, updated_at
    )
    SELECT gen_random_uuid()::text, ms.admin_id, ms.member_id, gpd.price,
           ms.start_date,
           ms.start_date,
           CASE WHEN s.paid THEN 'PAID' ELSE 'OVERDUE' END::"PaymentStatus",
           NOW(), NOW()
    FROM membership_rows ms
    JOIN member_rows m  ON m.id = ms.member_id
    JOIN member_spec s  ON s.user_name = m.user_name
    CROSS JOIN gym_plan_duration gpd
    RETURNING id
)
SELECT
    (SELECT count(*) FROM member_rows)     AS members,
    (SELECT count(*) FROM membership_rows) AS memberships,
    (SELECT count(*) FROM payment_rows)    AS payments;
