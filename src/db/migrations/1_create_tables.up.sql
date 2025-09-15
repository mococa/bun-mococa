CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    --
    name VARCHAR(50) NOT NULL UNIQUE,
    picture TEXT NOT NULL DEFAULT '',
    email VARCHAR(100) NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')) DEFAULT 'user',
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'banned')) DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS oauth_accounts (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    --
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    UNIQUE (provider, provider_id),
    UNIQUE (user_id, provider)
);

CREATE TABLE IF NOT EXISTS stuffs (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_stuffs (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    --
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stuff_id INTEGER NOT NULL REFERENCES stuffs(id) ON DELETE CASCADE,
    UNIQUE (user_id, stuff_id)
);

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    --
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stuff_id INTEGER NOT NULL REFERENCES stuffs(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Amount in cents
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
    transaction_id TEXT UNIQUE -- Unique identifier from payment provider (Stripe intent ID)
);