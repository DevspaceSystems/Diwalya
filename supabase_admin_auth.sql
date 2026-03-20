-- SQL Script for Setting Up Secure Admin Authentication
-- TABLE: admin_credentials
-- Use this in your Supabase SQL Editor to initialize the secure admin table and user.

-- 1. Create the table
CREATE TABLE IF NOT EXISTS admin_credentials (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'SUPER_ADMIN',
  is_active BOOLEAN DEFAULT TRUE,
  totp_secret TEXT,             -- For 2FA
  failed_attempts INT DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable pgcrypto for hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 3. Insert initial admin user
-- REPLACE 'your_admin_username' AND 'your_secure_password' with your desired credentials.
-- The crypt() function will securely hash the password using bcrypt (bf).

INSERT INTO admin_credentials (username, password_hash)
VALUES (
    'admin', 
    crypt('054Admin@diwalya', gen_salt('bf'))
)
ON CONFLICT (username) DO UPDATE 
SET password_hash = crypt('054Admin@diwalya', gen_salt('bf'));

-- Security Note:
-- After running this, delete the plain-text password from this file or delete the file entirely.
