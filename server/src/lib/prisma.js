const { PrismaClient } = require("@prisma/client");

// Reuse a single PrismaClient instance across the app (and across
// nodemon hot-reloads in dev) instead of creating a new one per request.
const prisma = new PrismaClient();

module.exports = prisma;
