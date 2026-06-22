CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    activated BOOLEAN NOT NULL DEFAULT TRUE,
    authority VARCHAR(32) NOT NULL DEFAULT 'ROLE_ADMIN',
    CONSTRAINT uk_users_username UNIQUE (username),
    CONSTRAINT ck_users_admin_authority CHECK (authority = 'ROLE_ADMIN')
);

CREATE TABLE oauth_clients (
    id BIGSERIAL PRIMARY KEY,
    client_id VARCHAR(100) NOT NULL,
    client_secret VARCHAR(100) NOT NULL,
    grant_types VARCHAR(255) NOT NULL,
    scopes VARCHAR(255) NOT NULL,
    resources VARCHAR(255) NOT NULL,
    redirect_uris VARCHAR(1000),
    access_token_validity INTEGER NOT NULL,
    refresh_token_validity INTEGER NOT NULL,
    additional_information TEXT,
    CONSTRAINT uk_oauth_clients_client_id UNIQUE (client_id),
    CONSTRAINT ck_oauth_clients_access_validity CHECK (access_token_validity > 0),
    CONSTRAINT ck_oauth_clients_refresh_validity CHECK (refresh_token_validity > 0)
);
