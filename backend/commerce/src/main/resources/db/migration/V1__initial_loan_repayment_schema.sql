-- UCM Fall 2026 — Loan Repayment Tracker
-- Pay-off date and minimum payment are calculated in the application, not stored.

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER'
);

CREATE TABLE admin (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users (id),
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL
);

CREATE TABLE bank_accounts (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL UNIQUE REFERENCES customers (id),
    bank_name VARCHAR(200) NOT NULL,
    routing_number VARCHAR(20) NOT NULL,
    account_number VARCHAR(30) NOT NULL,
    account_holder_name VARCHAR(200) NOT NULL
);

CREATE TABLE loans (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers (id),
    originated_on DATE NOT NULL,
    original_amount NUMERIC(14, 2) NOT NULL CHECK (original_amount > 0),
    remaining_balance NUMERIC(14, 2) NOT NULL CHECK (remaining_balance >= 0 AND remaining_balance <= original_amount),
    interest_rate NUMERIC(7, 4) NOT NULL CHECK (interest_rate >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payment_schedules (
    id BIGSERIAL PRIMARY KEY,
    loan_id BIGINT NOT NULL UNIQUE REFERENCES loans (id),
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('MONTHLY', 'BIWEEKLY', 'WEEKLY')),
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    day_of_month SMALLINT CHECK (day_of_month BETWEEN 1 AND 28),
    day_of_week SMALLINT CHECK (day_of_week BETWEEN 1 AND 7),
    start_date DATE NOT NULL,
    CONSTRAINT payment_schedule_cadence_fields CHECK (
        (frequency = 'MONTHLY' AND day_of_month IS NOT NULL AND day_of_week IS NULL)
        OR (frequency IN ('BIWEEKLY', 'WEEKLY') AND day_of_week IS NOT NULL AND day_of_month IS NULL)
    )
);

CREATE INDEX idx_loans_remaining_balance ON loans (remaining_balance);
CREATE INDEX idx_loans_customer_id ON loans (customer_id);

-- Pre-established admin login (no password encryption required).
INSERT INTO admin (username, password) VALUES ('admin', 'password');

-- Demo customers. Passwords are plaintext for this project.
INSERT INTO users (id, username, password, role) VALUES
    (1, 'jsmith', 'customer1', 'USER'),
    (2, 'mjohnson', 'customer2', 'USER'),
    (3, 'achen', 'customer3', 'USER'),
    (4, 'rpatel', 'customer4', 'USER');

INSERT INTO customers (id, user_id, name, email, phone) VALUES
    (1, 1, 'Jane Smith', 'jane.smith@email.com', '555-0101'),
    (2, 2, 'Marcus Johnson', 'marcus.johnson@email.com', '555-0102'),
    (3, 3, 'Aisha Chen', 'aisha.chen@email.com', '555-0103'),
    (4, 4, 'Rohan Patel', 'rohan.patel@email.com', '555-0104');

INSERT INTO bank_accounts (customer_id, bank_name, routing_number, account_number, account_holder_name) VALUES
    (1, 'Commerce Bank', '101000019', '123456789', 'Jane Smith'),
    (3, 'Commerce Bank', '101000019', '987654321', 'Aisha Chen'),
    (4, 'First National', '021000021', '456789123', 'Rohan Patel');

-- Remaining balance < original amount = partially repaid (required for demos).
-- Remaining balance = original amount = not yet repaid.
INSERT INTO loans (id, customer_id, originated_on, original_amount, remaining_balance, interest_rate) VALUES
    (1, 1, '2024-03-15', 25000.00, 18750.00, 6.5000),
    (2, 2, '2025-09-01', 12000.00, 12000.00, 7.2500),
    (3, 3, '2023-11-20', 40000.00, 22400.00, 5.9900),
    (4, 4, '2025-01-10', 8500.00, 3200.00, 8.0000);

-- day_of_week uses ISO: 1 = Monday ... 7 = Sunday
INSERT INTO payment_schedules (loan_id, frequency, amount, day_of_month, day_of_week, start_date) VALUES
    (1, 'MONTHLY', 450.00, 15, NULL, '2024-04-15'),
    (3, 'BIWEEKLY', 380.00, NULL, 3, '2024-01-03'),
    (4, 'WEEKLY', 95.00, NULL, 5, '2025-01-17');

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('customers_id_seq', (SELECT MAX(id) FROM customers));
SELECT setval('loans_id_seq', (SELECT MAX(id) FROM loans));
