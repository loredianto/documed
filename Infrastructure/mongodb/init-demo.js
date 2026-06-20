/*
 * Executed by the official MongoDB image only when the data volume is empty.
 * Accounts remain ordinary MongoDB documents; no application-side seeding is used.
 */
const username = process.env.DOCUMED_DEMO_ADMIN_USERNAME;
const passwordHash = process.env.DOCUMED_DEMO_ADMIN_PASSWORD_HASH;
const clientId = process.env.DOCUMED_DEMO_OAUTH_CLIENT_ID;
const clientSecretHash = process.env.DOCUMED_DEMO_OAUTH_CLIENT_SECRET_HASH;

if (!username || !passwordHash || !clientId || !clientSecretHash) {
    throw new Error("DocuMed demo auth database variables are required");
}

const authDatabase = db.getSiblingDB("auth_service");

authDatabase.users.updateOne(
    { username: username },
    {
        $setOnInsert: {
            username: username,
            password: passwordHash,
            activated: true,
            authorities: ["ROLE_ADMIN"]
        }
    },
    { upsert: true }
);

authDatabase.oauth_clients.updateOne(
    { clientId: clientId },
    {
        $setOnInsert: {
            clientId: clientId,
            clientSecret: clientSecretHash,
            grantTypes: "password,refresh_token",
            scopes: "read,write",
            resources: "platform-api",
            accessTokenValidity: 3600,
            refreshTokenValidity: 86400
        }
    },
    { upsert: true }
);
