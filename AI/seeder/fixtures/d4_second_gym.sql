-- D4 fixture: a SECOND gym, added on top of d1_one_gym.sql.
--
-- Why this exists: with one gym in the database, every tenant-scoping test passes
-- whether or not the scoping works. "Returns Karim's members" and "returns all
-- members" are the same result set. A second tenant is what turns app/db/scope.py
-- from an untested claim into a tested one.
--
-- Deliberately different values, so a leak is visible by inspection and not just
-- by row count: a different plan (365 days, 4500.00 vs. 30 days, 300.00) and
-- members whose memberships are all comfortably active, leaving gym 1 as the only
-- source of the expired / expiring-soon rows.
--
-- Run AFTER d1_one_gym.sql (which TRUNCATEs):
--   docker compose exec -T postgres psql -U admin -d ft_transcendence < seeder/fixtures/d4_second_gym.sql

-- Idempotency by explicit delete rather than TRUNCATE: this fixture must add a gym
-- without touching gym 1. Order is child-to-parent; we do not rely on the FKs
-- having ON DELETE CASCADE, because that is Dahani's choice to change.
DELETE FROM payments                  WHERE admin_id IN (SELECT id FROM users WHERE email = 'nadia@oasisgym.ma');
DELETE FROM memberships               WHERE admin_id IN (SELECT id FROM users WHERE email = 'nadia@oasisgym.ma');
DELETE FROM membership_plan_durations WHERE membership_plan_id IN (
    SELECT id FROM membership_plans WHERE admin_id IN (SELECT id FROM users WHERE email = 'nadia@oasisgym.ma'));
DELETE FROM membership_plans          WHERE admin_id IN (SELECT id FROM users WHERE email = 'nadia@oasisgym.ma');
DELETE FROM members                   WHERE admin_id IN (SELECT id FROM users WHERE email = 'nadia@oasisgym.ma');
DELETE FROM subscriptions             WHERE user_id  IN (SELECT id FROM users WHERE email = 'nadia@oasisgym.ma');
DELETE FROM users                     WHERE email = 'nadia@oasisgym.ma';

WITH
admin_user AS (
    INSERT INTO users (
        id, first_name, last_name, company_name, email, user_name, password,
        phone_number, gender, birth_date, role, account_status,
        is_account_verified, terms_accepted, profile_image_url, created_at, updated_at
    )
    VALUES (
        gen_random_uuid()::text, 'Nadia', 'Berrada', 'Oasis Gym Marrakech',
        'nadia@oasisgym.ma', 'nadia_admin', 'hashed_password_456',
        '+212600000002', 'FEMALE'::"Gender", '1985-09-30'::timestamp,
        'ADMIN'::"Role", 'ACTIVE'::"UserAccountStatus", true, true,
        'default-image.jpg', NOW(), NOW()
    )
    RETURNING id
),

-- A price no query scoped to gym 1 may ever return.
gym_plan AS (
    INSERT INTO membership_plans (id, admin_id, plan_name, description, is_active, created_at, updated_at)
    SELECT gen_random_uuid()::text, id, 'Premium Annual', 'Full access, 12 months', true, NOW(), NOW()
    FROM admin_user
    RETURNING id, admin_id
),
gym_plan_duration AS (
    INSERT INTO membership_plan_durations (id, membership_plan_id, duration_days, price, created_at, updated_at)
    SELECT gen_random_uuid()::text, id, 365, 4500.00, NOW(), NOW()
    FROM gym_plan
    RETURNING id, membership_plan_id, duration_days, price
),

member_spec (first_name, last_name, email, user_name, phone_number,
             address, emergency_contact, gender, birth_date, days_to_expiry) AS (
    VALUES
        ('Rachid','Ouali', 'rachid@gmail.com','rachid_o','+212644444444',
         'Marrakech','+212699999994','MALE'  ,DATE '1992-07-19', 200),
        ('Latifa','Sabri', 'latifa@gmail.com','latifa_s','+212655555555',
         'Marrakech','+212699999995','FEMALE',DATE '2000-03-08', 100)
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
           -- Joined when their membership began, not "now": a member whose
           -- created_at is later than their own membership start is inconsistent
           -- data, and scripts/check_history.py asserts against exactly that.
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
           'ACTIVE'::"MembershipStatus",
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
           ms.start_date, ms.start_date, 'PAID'::"PaymentStatus", NOW(), NOW()
    FROM membership_rows ms
    CROSS JOIN gym_plan_duration gpd
    RETURNING id
)
SELECT
    (SELECT count(*) FROM member_rows)     AS members,
    (SELECT count(*) FROM membership_rows) AS memberships,
    (SELECT count(*) FROM payment_rows)    AS payments;
