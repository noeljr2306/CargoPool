const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const { resetDb, createTestUser, prisma, prismaAdmin } = require("./helpers");

afterEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
  await prismaAdmin.$disconnect();
});

function tokenFor(user) {
  return jwt.sign(
    { userId: user.id, tenantId: user.tenantId, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
}

describe("RBAC on /api/shipments (SHIPPER only)", () => {
  it("rejects requests with no token", async () => {
    const res = await request(app).get("/api/shipments");
    expect(res.status).toBe(401);
  });

  it("rejects a FORWARDER trying to submit a shipment", async () => {
    const { user } = await createTestUser({
      tenantName: "Acme Forwarding",
      tenantType: "FORWARDER",
      email: "acme@example.com",
      password: "password123",
    });

    const res = await request(app)
      .post("/api/shipments")
      .set("Authorization", `Bearer ${tokenFor(user)}`)
      .send({
        productDescription: "Test",
        quantity: 1,
        weightVolume: 1,
        destination: "X",
      });

    expect(res.status).toBe(403);
  });

  it("allows a SHIPPER to submit a shipment", async () => {
    // A forwarder must exist so a new container has an owner.
    await createTestUser({
      tenantName: "Acme Forwarding",
      tenantType: "FORWARDER",
      email: "acme@example.com",
      password: "password123",
    });

    const { user } = await createTestUser({
      tenantName: "Small Shop",
      tenantType: "SHIPPER",
      email: "shop@example.com",
      password: "password123",
    });

    const res = await request(app)
      .post("/api/shipments")
      .set("Authorization", `Bearer ${tokenFor(user)}`)
      .send({
        productDescription: "Test goods",
        quantity: 1,
        weightVolume: 5,
        destination: "Lagos",
      });

    expect(res.status).toBe(201);
  });
  it("returns 409 when no forwarder exists to own a container", async () => {
    const { user } = await createTestUser({
      tenantName: "Small Shop",
      tenantType: "SHIPPER",
      email: "shop@example.com",
      password: "password123",
    });

    const res = await request(app)
      .post("/api/shipments")
      .set("Authorization", `Bearer ${tokenFor(user)}`)
      .send({
        productDescription: "Test goods",
        quantity: 1,
        weightVolume: 5,
        destination: "Lagos",
      });

    expect(res.status).toBe(409);
  });
});
