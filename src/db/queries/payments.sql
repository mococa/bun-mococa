-- name: CreatePayment :one
INSERT INTO payments (
    user_id,
    stuff_id,
    amount,
    transaction_id
) VALUES (
    sqlc.arg(user_id),
    sqlc.arg(stuff_id),
    sqlc.arg(amount),
    sqlc.arg(transaction_id)
) RETURNING *;

-- name: FindPaymentByTransactionID :one
SELECT * FROM payments
WHERE transaction_id = sqlc.arg(transaction_id) LIMIT 1;

-- name: UpdatePaymentStatus :exec
UPDATE payments
SET status = sqlc.arg(status)
WHERE transaction_id = sqlc.arg(transaction_id);