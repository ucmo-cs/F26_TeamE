SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));
SELECT setval('customers_id_seq', (SELECT COALESCE(MAX(id), 1) FROM customers));
SELECT setval('loans_id_seq', (SELECT COALESCE(MAX(id), 1) FROM loans));
SELECT setval('bank_accounts_id_seq', (SELECT COALESCE(MAX(id), 1) FROM bank_accounts));
SELECT setval('payment_schedules_id_seq', (SELECT COALESCE(MAX(id), 1) FROM payment_schedules));
SELECT setval('admin_id_seq', (SELECT COALESCE(MAX(id), 1) FROM admin));
