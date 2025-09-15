-- name: FindUserByEmail :one
SELECT *
FROM
  users
WHERE
  email = sqlc.arg(email)
LIMIT 1;

-- name: FindUserByID :one
SELECT * FROM users
WHERE id = sqlc.arg(id) LIMIT 1;

-- name: CreateUser :one
INSERT INTO
  users (
    name,
    picture,
    email
) VALUES (
    sqlc.arg(name),
    sqlc.arg(picture),
    sqlc.arg(email)
) RETURNING *;

-- name: CreateOAuthUser :one
INSERT INTO
  oauth_accounts (
    user_id,
    provider,
    provider_id
) VALUES (
    sqlc.arg(user_id),
    sqlc.arg(provider),
    sqlc.arg(provider_id)
) RETURNING *;

-- name: FindOAuthByUserID :one
SELECT * FROM oauth_accounts
WHERE user_id = sqlc.arg(user_id) AND provider = sqlc.arg(provider);

-- name: FindUserByOAuth :one
SELECT u.*
FROM oauth_accounts o
JOIN users u ON u.id = o.user_id
WHERE o.provider = sqlc.arg(provider) AND o.provider_id = sqlc.arg(provider_id)
LIMIT 1;

-- name: UpdateUserRole :exec
UPDATE users
SET
  role = sqlc.arg(role)
WHERE id = sqlc.arg(id);

-- name: UpdateUserStatus :exec
UPDATE users
SET
  status = sqlc.arg(status)
WHERE id = sqlc.arg(id);

-- name: UpdateUserPicture :exec
UPDATE users
SET
  picture = sqlc.arg(picture)
WHERE id = sqlc.arg(id);