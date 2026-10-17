// Loads .env.test before any test file runs, so `prisma.js` connects
// to the test database instead of dev.
require("dotenv").config({ path: ".env.test" });
