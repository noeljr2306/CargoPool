const request = require("supertest");
const app = require("../src/app");
const { resetDb, createTestUser, prisma, prismaAdmin } = require("./helpers");

afterEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
  await prismaAdmin.$disconnect();
});

describe("POST /api/auth/register", () => {
  it("creates a tenant and user, returns a token", async () => {
    const res = await request(app).post("/api/auth/register").send({
      tenantName: "Acme Forwarding",
      tenantType: "FORWARDER",
      email: "acme@example.com",
      password: "password123",
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe("FORWARDER");
  });

  it("rejects a duplicate email", async () => {
    const payload = {
      tenantName: "Acme Forwarding",
      tenantType: "FORWARDER",
      email: "dupe@example.com",
      password: "password123",
    };
    await request(app).post("/api/auth/register").send(payload);
    const res = await request(app).post("/api/auth/register").send(payload);

    expect(res.status).toBe(409);
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with correct credentials", async () => {
    await request(app).post("/api/auth/register").send({
      tenantName: "Small Shop",
      tenantType: "SHIPPER",
      email: "shop@example.com",
      password: "password123",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "shop@example.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("rejects a wrong password", async () => {
    await request(app).post("/api/auth/register").send({
      tenantName: "Small Shop",
      tenantType: "SHIPPER",
      email: "shop2@example.com",
      password: "password123",
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "shop2@example.com",
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
  });
});
