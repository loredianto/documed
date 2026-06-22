-- Demo credentials are inserted only when all related environment placeholders
-- are configured. Production environments can leave them empty and manage rows
-- directly in PostgreSQL.
INSERT INTO users (username, password, activated, authority)
SELECT '${demo_admin_username}', '${demo_admin_password_hash}', TRUE, 'ROLE_ADMIN'
WHERE '${demo_admin_username}' <> ''
  AND '${demo_admin_password_hash}' <> ''
ON CONFLICT (username) DO NOTHING;

INSERT INTO oauth_clients (
    client_id,
    client_secret,
    grant_types,
    scopes,
    resources,
    access_token_validity,
    refresh_token_validity
)
SELECT
    '${demo_oauth_client_id}',
    '${demo_oauth_client_secret_hash}',
    'password,refresh_token',
    'read,write',
    'platform-api',
    3600,
    86400
WHERE '${demo_oauth_client_id}' <> ''
  AND '${demo_oauth_client_secret_hash}' <> ''
ON CONFLICT (client_id) DO NOTHING;
