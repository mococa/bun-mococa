-- name: FindStuffByID :one
SELECT * FROM stuffs
WHERE id = sqlc.arg(id) LIMIT 1;

-- name: ListUserStuffs :many
SELECT stuff_id
FROM user_stuffs
WHERE user_stuffs.user_id = sqlc.arg(user_id)
ORDER BY user_stuffs.created_at DESC;

-- name: EnrollUserInStuff :one
INSERT INTO user_stuffs (
    user_id,
    stuff_id
) VALUES (
    sqlc.arg(user_id),
    sqlc.arg(stuff_id)
) RETURNING *;

-- name: FindStuffEnrollment :one
SELECT * FROM user_stuffs
WHERE user_id = sqlc.arg(user_id) AND stuff_id = sqlc.arg(stuff_id);