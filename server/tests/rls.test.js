const { withTenant } = require("../src/lib/tenantContext");
const { resetDb, createTestUser, prisma, prismaAdmin } = require("./helpers");

afterEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
  await prismaAdmin.$disconnect();
});

describe("Row-Level Security isolation", () => {
  it("a tenant cannot read another tenant's users under withTenant", async () => {
    const { tenant: tenantA, user: userA } = await createTestUser({
      tenantName: "Tenant A",
      tenantType: "SHIPPER",
      email: "a@example.com",
      password: "password123",
    });
    await createTestUser({
      tenantName: "Tenant B",
      tenantType: "SHIPPER",
      email: "b@example.com",
      password: "password123",
    });

    const visibleUsers = await withTenant(tenantA.id, (tx) =>
      tx.user.findMany(),
    );

    // RLS should filter this down to only tenant A's own user.
    expect(visibleUsers).toHaveLength(1);
    expect(visibleUsers[0].id).toBe(userA.id);
  });

  it("a plain query with no tenant context set sees nothing (RLS default-denies)", async () => {
    await createTestUser({
      tenantName: "Tenant A",
      tenantType: "SHIPPER",
      email: "a@example.com",
      password: "password123",
    });

    // Run a raw transaction with NO SET LOCAL app.current_tenant_id —
    // simulates a query that forgot to use withTenant().
    const rows = await prisma.$transaction(async (tx) => {
      return tx.$queryRaw`SELECT * FROM "user"`;
    });

    expect(rows).toHaveLength(0);
  });
});
