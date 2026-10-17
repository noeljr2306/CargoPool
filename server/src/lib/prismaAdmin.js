const { PrismaClient } = require("@prisma/client");

// A second Prisma client, connected via a BYPASSRLS role. Use this
// ONLY for the small, named set of genuinely cross-tenant operations
// (documented at each call site) — never as a default or convenience.
const prismaAdmin = new PrismaClient({
  datasources: { db: { url: process.env.ADMIN_DATABASE_URL } },
});

module.exports = prismaAdmin;
