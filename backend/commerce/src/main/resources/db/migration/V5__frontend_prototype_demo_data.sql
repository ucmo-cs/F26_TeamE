-- Prototype UI demo accounts (from the former frontend mock dataset).
-- Admin login used by the polished UI: admin / admin123
-- Customer logins: jane@example.com, robert@example.com, amanda@example.com, marcus@example.com / customer123

UPDATE admin SET password = 'admin123' WHERE username = 'admin';

ALTER TABLE bank_accounts
    ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) NOT NULL DEFAULT 'CHECKING';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'bank_accounts_account_type_check'
    ) THEN
        ALTER TABLE bank_accounts
            ADD CONSTRAINT bank_accounts_account_type_check
            CHECK (account_type IN ('CHECKING', 'SAVINGS'));
    END IF;
END $$;

INSERT INTO users (username, password, role)
SELECT v.username, v.password, 'USER'
FROM (VALUES
    ('jane', 'customer123'),
    ('rdavis', 'customer123'),
    ('amiller', 'customer123'),
    ('mvance', 'customer123')
) AS v(username, password)
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.username = v.username);

INSERT INTO customers (user_id, name, email, phone)
SELECT u.id, v.name, v.email, v.phone
FROM (VALUES
    ('jane', 'Jane Smith', 'jane@example.com', '(555) 555-1234'),
    ('rdavis', 'Robert Davis', 'robert@example.com', '(555) 555-5678'),
    ('amiller', 'Amanda Miller', 'amanda@example.com', '(555) 555-8765'),
    ('mvance', 'Marcus Vance', 'marcus@example.com', '(555) 555-4321')
) AS v(username, name, email, phone)
JOIN users u ON u.username = v.username
WHERE NOT EXISTS (SELECT 1 FROM customers c WHERE c.email = v.email);

INSERT INTO bank_accounts (customer_id, bank_name, routing_number, account_number, account_holder_name, account_type)
SELECT c.id, v.bank_name, v.routing_number, v.account_number, v.holder, v.account_type
FROM (VALUES
    ('jane@example.com', 'Example National Bank', '000012345', '000987654321', 'Jane Smith', 'CHECKING'),
    ('amanda@example.com', 'FivePoint Bank', '000034567', '000112233445', 'Amanda Miller', 'SAVINGS'),
    ('marcus@example.com', 'Metropolitan Credit Union', '000098765', '000554433221', 'Marcus Vance', 'CHECKING')
) AS v(email, bank_name, routing_number, account_number, holder, account_type)
JOIN customers c ON c.email = v.email
WHERE NOT EXISTS (SELECT 1 FROM bank_accounts b WHERE b.customer_id = c.id);

INSERT INTO loans (customer_id, originated_on, original_amount, remaining_balance, interest_rate)
SELECT c.id, v.originated_on::date, v.original_amount, v.remaining_balance, v.interest_rate
FROM (VALUES
    ('jane@example.com', '2026-08-14', 25000.00, 18420.32, 6.2500),
    ('robert@example.com', '2026-05-10', 15000.00, 11200.00, 5.7500),
    ('amanda@example.com', '2026-09-01', 40000.00, 38900.50, 7.1000),
    ('marcus@example.com', '2024-01-15', 10000.00, 0.00, 4.5000)
) AS v(email, originated_on, original_amount, remaining_balance, interest_rate)
JOIN customers c ON c.email = v.email
WHERE NOT EXISTS (SELECT 1 FROM loans l WHERE l.customer_id = c.id);

INSERT INTO payment_schedules (loan_id, frequency, amount, day_of_month, day_of_week, start_date)
SELECT l.id, v.frequency, v.amount, v.day_of_month, v.day_of_week, v.start_date::date
FROM (VALUES
    ('jane@example.com', 'BIWEEKLY', 250.00, NULL::smallint, 5::smallint, '2026-10-16'),
    ('amanda@example.com', 'MONTHLY', 795.00, 15::smallint, NULL::smallint, '2026-10-15')
) AS v(email, frequency, amount, day_of_month, day_of_week, start_date)
JOIN customers c ON c.email = v.email
JOIN loans l ON l.customer_id = c.id
WHERE NOT EXISTS (SELECT 1 FROM payment_schedules s WHERE s.loan_id = l.id);

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('customers_id_seq', (SELECT MAX(id) FROM customers));
SELECT setval('loans_id_seq', (SELECT MAX(id) FROM loans));
SELECT setval('bank_accounts_id_seq', (SELECT COALESCE(MAX(id), 1) FROM bank_accounts));
SELECT setval('payment_schedules_id_seq', (SELECT COALESCE(MAX(id), 1) FROM payment_schedules));
