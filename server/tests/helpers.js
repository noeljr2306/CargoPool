const prismaAdmin = require("../src/lib/prismaAdmin");
const prisma = require("../src/lib/prisma"); // restricted client, for tests that need it directly
const bcrypt = require("bcrypt");

// Test setup/teardown is inherently administrative — equivalent to a
// seed script — so it uses the admin (BYPASSRLS) client.
async function resetDb() {
  await prismaAdmin.trackingEvent.deleteMany();
  await prismaAdmin.auditLog.deleteMany();
  await prismaAdmin.manifest.deleteMany();
  await prismaAdmin.shipment.deleteMany();
  await prismaAdmin.container.deleteMany();
  await prismaAdmin.user.deleteMany();
  await prismaAdmin.tenant.deleteMany();
}

async function createTestUser({
  tenantName,
  tenantType,
  email,
  password,
  role,
}) {
  const tenant = await prismaAdmin.tenant.create({
    data: { name: tenantName, type: tenantType },
  });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prismaAdmin.user.create({
    data: {
      tenantId: tenant.id,
      email,
      passwordHash,
      role: role || tenantType,
    },
  });
  return { tenant, user };
}

module.exports = { resetDb, createTestUser, prisma, prismaAdmin };
