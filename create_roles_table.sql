-- Create roles table with JSON permissions
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add sample roles
INSERT INTO roles (name, description, permissions) VALUES
('admin', 'Full system access', '["users", "consumers", "rates", "meters", "transactions", "reports", "settings"]'),
('manager', 'Management access', '["consumers", "rates", "meters", "transactions", "reports"]'),
('clerk', 'Basic operations', '["consumers", "meters", "transactions"]'),
('viewer', 'Read-only access', '["consumers", "rates", "meters"]');

-- Update users table to reference roles
ALTER TABLE users ADD COLUMN role_id INTEGER REFERENCES roles(id) DEFAULT 3;
